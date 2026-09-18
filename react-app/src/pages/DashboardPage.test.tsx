import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import App from '../App'
import { createAuth } from '../services/auth'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

test('falha na montagem mantém cabeçalho e permite tentar novamente', async () => {
  createAuth().signIn('admin@demo.com', '123456')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar esta página.')
  expect(screen.getByRole('navigation')).toBeVisible()
  write.mockRestore()
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(document.querySelector('.page-head')).not.toBeNull()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

async function start(role: 'admin' | 'user' = 'admin', hash = '#dashboard') {
  createAuth().signIn(role === 'admin' ? 'admin@demo.com' : 'usuario@demo.com', '123456')
  window.history.replaceState(null, '', hash)
  render(<StrictMode><App /></StrictMode>)
  return screen.findByRole('navigation', { name: 'Navegação principal' })
}

test('troca de identidade em outra aba descarta formulário da conta anterior', async () => {
  await start('admin', '#rooms')
  await userEvent.click(screen.getByRole('button', { name: 'Nova sala' }))
  await userEvent.type(screen.getByLabelText('Nome da sala'), 'Rascunho da primeira conta')
  const users = JSON.parse(localStorage.getItem('app_users')!)
  users.push({ id: 'second', name: 'Outra conta', email: 'second@example.com', password: '123456', role: 'admin' })
  localStorage.setItem('app_users', JSON.stringify(users))
  localStorage.setItem('app_session', JSON.stringify({ userId: 'second' }))
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'app_session' })))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByText('Outra conta')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Nova sala' }))
  expect(screen.getByLabelText('Nome da sala')).toHaveValue('')
})

test('estrutura React monta uma vez, navega pelos módulos e acompanha histórico', async () => {
  const nav = await start()
  expect(screen.getAllByRole('navigation')).toHaveLength(1)
  expect(document.querySelectorAll('.app-header')).toHaveLength(1)
  await userEvent.click(within(nav).getByRole('button', { name: 'Salas' }))
  expect(window.location.hash).toBe('#rooms')
  expect(screen.getByRole('button', { name: 'Nova sala' })).toBeVisible()
  expect(within(nav).getByRole('button', { name: 'Salas' })).toHaveAttribute('aria-current', 'page')
  act(() => {
    window.history.replaceState(null, '', '#availability')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(document.querySelector('#f-unit')).not.toBeNull()
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
})

test('usuário não abre rotas administrativas por hash ou menu', async () => {
  const nav = await start('user', '#financial')
  expect(window.location.hash).toBe('#dashboard')
  expect(within(nav).queryByRole('button', { name: 'Contas / Financeiro' })).not.toBeInTheDocument()
  expect(within(nav).getByRole('button', { name: 'Meus Horários' })).toBeVisible()
  act(() => {
    window.location.hash = '#rooms'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(window.location.hash).toBe('#dashboard')
  expect(screen.queryByRole('button', { name: 'Nova sala' })).not.toBeInTheDocument()
})

test('tema sincroniza cabeçalho e configurações e preserva outras preferências', async () => {
  localStorage.setItem('app_settings', JSON.stringify({ theme: 'light', whatsapp: '5511999999999' }))
  const nav = await start('admin', '#settings')
  await userEvent.click(screen.getByRole('button', { name: 'Escuro' }))
  expect(screen.getByRole('button', { name: 'Alternar tema' })).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(screen.getByRole('button', { name: 'Alternar tema' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(JSON.parse(localStorage.getItem('app_settings')!)).toEqual({ theme: 'light', whatsapp: '5511999999999' })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  await userEvent.click(screen.getByRole('button', { name: 'Alternar tema' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar o tema.')
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(within(nav).getByRole('button', { name: 'Configurações' })).toHaveAttribute('aria-current', 'page')
})

test('cadastro continua funcional dentro do painel React e sair limpa modais', async () => {
  await start('admin', '#rooms')
  await userEvent.click(await screen.findByRole('button', { name: 'Nova sala' }))
  await userEvent.type(screen.getByLabelText('Nome da sala'), 'Sala React')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(JSON.parse(localStorage.getItem('app_rooms')!).some((room: { name: string }) => room.name === 'Sala React')).toBe(true)
  await userEvent.click(screen.getByRole('button', { name: 'Dashboard' }))
  expect(await screen.findByRole('heading', { name: 'Agenda de reservas' })).toBeVisible()
  const available = JSON.parse(localStorage.getItem('app_rooms')!).filter((room: { status: string }) => room.status === 'disponivel').length
  expect(screen.getByText('Salas disponíveis').closest('.stat-card')?.querySelector('.stat-value')).toHaveTextContent(String(available))
  expect(document.querySelector('#view-root')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeVisible()
  expect(localStorage.getItem('app_session')).toBeNull()
  expect(document.querySelector('#modal-root')).toBeNull()
  expect(document.querySelector('.app-header')).toBeNull()
})

test('remoção da sessão em outra aba desmonta o painel; falha de logout preserva acesso', async () => {
  await start()
  const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
  await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível sair.')
  expect(screen.getByRole('navigation')).toBeVisible()
  remove.mockRestore()
  localStorage.removeItem('app_session')
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'app_session' })))
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  expect(screen.getByLabelText('E-mail')).toBeVisible()
})

test('trocar de módulo cancela diálogo aberto e permite novo diálogo', async () => {
  const nav = await start('admin', '#rooms')
  await userEvent.click(await screen.findByRole('button', { name: 'Nova sala' }))
  expect(screen.getByRole('dialog')).toBeVisible()
  fireEvent.click(within(nav).getByRole('button', { name: 'Profissionais' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar profissional' }))
  expect(screen.getAllByRole('dialog')).toHaveLength(1)
})
