import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { AvailabilityPage } from './AvailabilityPage'
import { MySchedulePage } from './MySchedulePage'
import { createAuth } from '../services/auth'
import { readData } from '../services/repository'

beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) })
test('usuário reserva pela grade e encontra somente sua reserva na agenda pessoal', async () => {
  const auth = createAuth(); auth.signIn('usuario@demo.com', '123456')
  readData(); localStorage.setItem('app_schedules', '[]')
  const user = auth.restoreSession()!
  const view = render(<AvailabilityPage user={user} />)
  fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2099-01' } })
  await userEvent.selectOptions(screen.getByLabelText('Semana'), '1')
  await userEvent.selectOptions(screen.getByLabelText('Sala'), 'duna')
  await userEvent.click(screen.getAllByRole('button', { name: /Horário disponível/ })[0])
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar horário' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Horário confirmado')
  expect(readData().schedules[0].userId).toBe(user.id)
  view.unmount()
  render(<MySchedulePage user={user} />)
  expect(screen.getByRole('table')).toHaveTextContent('Duna')
  expect(screen.getAllByRole('row')).toHaveLength(2)
})
test('falha ao salvar mantém formulário e permite nova tentativa', async () => {
  const auth = createAuth(); auth.signIn('admin@demo.com', '123456')
  readData(); localStorage.setItem('app_schedules', '[]')
  render(<AvailabilityPage user={auth.restoreSession()!} />)
  fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2099-01' } })
  await userEvent.selectOptions(screen.getByLabelText('Semana'), '1')
  await userEvent.selectOptions(screen.getByLabelText('Sala'), 'duna')
  await userEvent.click(screen.getAllByRole('button', { name: /Horário disponível/ })[0])
  await userEvent.selectOptions(screen.getByLabelText('Profissional'), 'reference_beatriz')
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar alocação' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar')
  expect(screen.getByLabelText('Profissional')).toHaveValue('reference_beatriz')
  write.mockRestore()
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar alocação' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(readData().schedules).toHaveLength(1)
})

test('conflito surgido com modal aberto impede reserva na confirmação', async () => {
  const auth = createAuth(); auth.signIn('usuario@demo.com', '123456')
  readData(); localStorage.setItem('app_schedules', '[]')
  render(<AvailabilityPage user={auth.restoreSession()!} />)
  fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2099-01' } })
  await userEvent.selectOptions(screen.getByLabelText('Semana'), '1')
  await userEvent.selectOptions(screen.getByLabelText('Sala'), 'duna')
  await userEvent.click(screen.getAllByRole('button', { name: /Horário disponível/ })[0])
  localStorage.setItem('app_schedules', JSON.stringify([{ id: 'other', roomId: 'duna', date: '2099-01-05', time: '08:00', status: 'reservado' }]))
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar horário' }))
  expect(screen.getByRole('alert')).toHaveTextContent('indisponível')
  expect(readData().schedules).toHaveLength(1)
})
