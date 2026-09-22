import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { FinancialPage } from './FinancialPage'
import { ConveniencesPage } from './ConveniencesPage'
import { createAuth } from '../services/auth'
import { readData } from '../services/repository'
import { buildCSV } from '../services/finance'

beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); createAuth().signIn('admin@demo.com', '123456') })
test('cria conta, registra pagamento e combina filtros financeiros', async () => {
  render(<FinancialPage />)
  await userEvent.click(screen.getByRole('button', { name: 'Nova conta' }))
  await userEvent.type(screen.getByLabelText('Descrição'), 'Conta React')
  await userEvent.clear(screen.getByLabelText('Valor (R$)'))
  await userEvent.type(screen.getByLabelText('Valor (R$)'), '123.45')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await userEvent.click(within(screen.getByText('Conta React').closest('tr')!).getByRole('button', { name: 'Marcar como pago' }))
  const account = readData().financial.find(item => item.description === 'Conta React')!
  expect(account).toMatchObject({ status: 'pago', value: 123.45 })
  expect(account.paymentDate).toBeTruthy()
  await userEvent.selectOptions(screen.getByLabelText('Profissional'), 'prof_1')
  await userEvent.selectOptions(screen.getByLabelText('Status'), 'pago')
  await userEvent.selectOptions(screen.getByLabelText('Mês de vencimento'), account.dueDate.slice(0, 7))
  expect(screen.getByRole('table')).toHaveTextContent('Conta React')
  await userEvent.selectOptions(screen.getByLabelText('Status'), 'pendente')
  expect(screen.queryByText('Conta React')).not.toBeInTheDocument()
})
test('conveniência calcula total, preserva formulário em falha e salva na nova tentativa', async () => {
  render(<ConveniencesPage />)
  await userEvent.click(screen.getByRole('button', { name: 'Registrar consumo' }))
  await userEvent.selectOptions(within(screen.getByRole('dialog')).getByLabelText('Conveniência'), 'cappuccino')
  expect(screen.getByLabelText('Valor unitário (R$)')).toHaveValue(5)
  await userEvent.clear(screen.getByLabelText('Quantidade'))
  await userEvent.type(screen.getByLabelText('Quantidade'), '3')
  await userEvent.clear(screen.getByLabelText('Valor unitário (R$)'))
  await userEvent.type(screen.getByLabelText('Valor unitário (R$)'), '25')
  expect(screen.getByRole('dialog')).toHaveTextContent(/75,00/)
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar')
  write.mockRestore()
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(readData().conveniences.at(-1)).toMatchObject({ quantity: 3, unitValue: 25 })
})
test('relatório exporta apenas linhas filtradas e escapa CSV', async () => {
  const create = vi.fn().mockReturnValue('blob:report'), revoke = vi.fn()
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }))
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const data = readData()
  render(<FinancialPage reports />)
  await userEvent.selectOptions(screen.getByLabelText('Profissional'), 'prof_3')
  await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
  const blob = create.mock.calls[0][0] as Blob
  const csv = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob) })
  expect(csv).toContain(data.professionals.find(item => item.id === 'prof_3')!.name)
  expect(csv).not.toContain(data.professionals.find(item => item.id === 'prof_1')!.name)
  expect(revoke).toHaveBeenCalledWith('blob:report')
  expect(buildCSV([['a;"b', '=SUM(A1)', 12]])).toContain('"a;""b";\'=SUM(A1);12')
})
