import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SettingsPage } from './SettingsPage'
import { createAuth } from '../services/auth'

test('valida, salva e remove contato preservando tema; falha não perde campo', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const auth = createAuth(); auth.signIn('usuario@demo.com', '123456')
  localStorage.setItem('app_settings', JSON.stringify({ theme: 'dark' }))
  render(<SettingsPage user={auth.restoreSession()!} theme="dark" onThemeChange={() => {}} />)
  const field = screen.getByLabelText('WhatsApp com DDD')
  await userEvent.type(field, '123')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
  expect(screen.getByRole('alert')).toHaveTextContent('válido')
  await userEvent.clear(field); await userEvent.type(field, '11999999999')
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  await userEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar')
  expect(field).toHaveValue('11999999999')
  write.mockRestore()
  await userEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
  expect(JSON.parse(localStorage.getItem('app_settings')!)).toEqual({ theme: 'dark', whatsapp: '5511999999999' })
  await userEvent.clear(field)
  await userEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
  expect(screen.getByRole('status')).toHaveTextContent('Contato removido')
})

test('contato acompanha outra aba quando não há edição e preserva rascunho quando há', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const auth = createAuth(); auth.signIn('admin@demo.com', '123456')
  render(<SettingsPage user={auth.restoreSession()!} theme="light" onThemeChange={() => {}} />)
  const update = (whatsapp: string) => {
    localStorage.setItem('app_settings', JSON.stringify({ theme: 'light', whatsapp }))
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'app_settings' })))
  }
  update('5511988887777')
  expect(screen.getByLabelText('WhatsApp com DDD')).toHaveValue('5511988887777')
  await userEvent.clear(screen.getByLabelText('WhatsApp com DDD'))
  await userEvent.type(screen.getByLabelText('WhatsApp com DDD'), '11999998888')
  localStorage.setItem('app_settings', '{')
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'app_settings' })))
  expect(screen.getByRole('alert')).toHaveTextContent('desatualizados')
  expect(screen.getByLabelText('WhatsApp com DDD')).toHaveValue('11999998888')
  update('5511977776666')
  expect(screen.getByLabelText('WhatsApp com DDD')).toHaveValue('11999998888')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
  update('5511966665555')
  expect(screen.getByLabelText('WhatsApp com DDD')).toHaveValue('5511966665555')
})
