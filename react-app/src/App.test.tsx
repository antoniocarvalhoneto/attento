import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import App from './App'
import { openDashboard } from './services/navigation'

vi.mock('./services/navigation', async importOriginal => ({
  ...await importOriginal<typeof import('./services/navigation')>(),
  openDashboard: vi.fn(),
}))

test.each(['Administrador', 'Usuário'])('login %s persiste a sessão antes de abrir o painel', async role => {
  render(<App />)
  await userEvent.click(screen.getByText('Experimentar com uma conta de demonstração'))
  await userEvent.click(screen.getByRole('button', { name: new RegExp(role) }))
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(JSON.parse(localStorage.getItem('app_session')!)).toEqual({ userId: role === 'Administrador' ? 'admin_demo' : 'user_demo' })
  expect(openDashboard).toHaveBeenCalled()
  expect(localStorage.getItem('app_rooms')).toBeNull()
})

test('restaura usuário existente e tema sem substituir cadastros', () => {
  const users = [{ id: 'custom', name: 'Nome', email: 'custom@example.com', password: 'secret', role: 'admin' }]
  localStorage.setItem('app_users', JSON.stringify(users))
  localStorage.setItem('app_session', JSON.stringify({ userId: 'custom' }))
  localStorage.setItem('app_settings', JSON.stringify({ theme: 'dark' }))
  render(<App />)
  expect(openDashboard).toHaveBeenCalled()
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(JSON.parse(localStorage.getItem('app_users')!)).toEqual(users)
})

test('sessão corrompida mantém o login e nova sessão de outra aba abre o painel', () => {
  localStorage.setItem('app_session', '{')
  render(<App />)
  expect(openDashboard).not.toHaveBeenCalled()
  localStorage.setItem('app_session', JSON.stringify({ userId: 'admin_demo' }))
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'app_session' })))
  expect(openDashboard).toHaveBeenCalledTimes(1)
})

test('falha ao persistir mostra erro e não abre o painel', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
  render(<App />)
  await userEvent.type(screen.getByLabelText('E-mail'), 'admin@demo.com')
  await userEvent.type(screen.getByLabelText('Senha'), '123456')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir o acesso.')
  expect(openDashboard).not.toHaveBeenCalled()
})

test('histórico revalida sessão e a desmontagem remove os eventos', () => {
  const { unmount } = render(<App />)
  localStorage.setItem('app_session', JSON.stringify({ userId: 'admin_demo' }))
  act(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
  expect(openDashboard).toHaveBeenCalledTimes(1)
  unmount()
  act(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
  expect(openDashboard).toHaveBeenCalledTimes(1)
})
