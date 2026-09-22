import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { CatalogPage } from './CatalogPage'
import { createAuth } from '../services/auth'
import { readData } from '../services/repository'

test('edita e exclui sala sem vínculos, mas preserva sala vinculada', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  createAuth().signIn('admin@demo.com', '123456')
  render(<CatalogPage kind="rooms" />)
  const linked = screen.getByText('Duna').closest('tr')!
  await userEvent.click(within(linked).getByRole('button', { name: 'Excluir' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))
  expect(screen.getByRole('alert')).toHaveTextContent('vinculados')
  await userEvent.keyboard('{Escape}')
  await userEvent.click(screen.getByRole('button', { name: 'Nova sala' }))
  await userEvent.type(screen.getByLabelText('Nome da sala'), 'Teste CRUD')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await userEvent.click(within(screen.getByText('Teste CRUD').closest('tr')!).getByRole('button', { name: 'Editar' }))
  await userEvent.clear(screen.getByLabelText('Nome da sala'))
  await userEvent.type(screen.getByLabelText('Nome da sala'), 'Renomeada')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await userEvent.click(within(screen.getByText('Renomeada').closest('tr')!).getByRole('button', { name: 'Excluir' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))
  expect(readData().rooms.some(room => room.name === 'Renomeada')).toBe(false)
})

test('profissional é cadastrado com unidade e sala escolhidas', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  createAuth().signIn('admin@demo.com', '123456')
  render(<CatalogPage kind="professionals" />)
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar profissional' }))
  await userEvent.type(screen.getByLabelText('Nome'), 'Profissional React')
  await userEvent.selectOptions(screen.getByLabelText('Unidade'), 'europa')
  expect(screen.getByLabelText('Sala')).toHaveValue('onda')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(readData().professionals.find(item => item.name === 'Profissional React')).toMatchObject({ unitId: 'europa', roomId: 'onda' })
})
