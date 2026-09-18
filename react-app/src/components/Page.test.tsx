import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { CatalogPage } from '../pages/CatalogPage'
import { createAuth } from '../services/auth'

test('falha em atualização de fundo preserva formulário e dados digitados até a recuperação', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  createAuth().signIn('admin@demo.com', '123456')
  render(<CatalogPage kind="rooms" />)
  await userEvent.click(screen.getByRole('button', { name: 'Nova sala' }))
  await userEvent.type(screen.getByLabelText('Nome da sala'), 'Rascunho preservado')
  const original = localStorage.getItem('app_rooms')!
  localStorage.setItem('app_rooms', '{')
  act(() => window.dispatchEvent(new Event('focus')))
  expect(screen.getByRole('dialog')).toBeVisible()
  expect(screen.getByLabelText('Nome da sala')).toHaveValue('Rascunho preservado')
  expect(screen.getByRole('alert')).toHaveTextContent('desatualizados')
  localStorage.setItem('app_rooms', original)
  fireEvent(window, new StorageEvent('storage', { key: 'app_rooms' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Nome da sala')).toHaveValue('Rascunho preservado')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(screen.getByText('Rascunho preservado')).toBeVisible()
})
