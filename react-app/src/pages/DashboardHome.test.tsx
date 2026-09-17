import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { DashboardHome } from './DashboardHome'
import type { DashboardSnapshot } from '../services/dashboard'
import type { PanelApi } from '../services/panel'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 17, 12))
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => vi.useRealTimers())

function fixture(role: 'admin' | 'user' = 'admin') {
  const snapshot: DashboardSnapshot = {
    user: { id: 'u', name: 'Teste Pessoa', role, email: 'u@example.com' },
    rooms: [{ id: 'r', name: '<img src=x onerror=alert(1)>', status: 'disponivel' }],
    professionals: [{ id: 'p', name: 'Profissional', status: 'ativo' }], units: [{ id: 'unit', name: 'Unidade' }],
    schedules: Array.from({ length: 7 }, (_, index) => ({ id: String(index), date: '2026-09-18', time: `${String(index + 8).padStart(2, '0')}:00`, status: 'reservado', roomId: 'r', professionalId: 'p', unitId: 'unit', userId: index === 0 ? 'u' : 'other' })),
    accounts: [{ id: 'a', status: 'pendente' }], whatsapp: '',
  }
  const api: PanelApi = { readDashboard: vi.fn(() => snapshot), allowed: () => true, navigation: { admin: [], user: [] }, titles: {}, mount: vi.fn() }
  return { api, snapshot }
}

test('admin usa componentes React, limita prévia e mantém gráfico e links', async () => {
  const { api } = fixture()
  render(<DashboardHome api={api} />)
  expect(await screen.findByRole('heading', { name: 'Olá, Teste' })).toBeVisible()
  expect(screen.getByText('Próximas reservas · Exibindo 6 de 7 reservas')).toBeVisible()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7)
  expect(screen.getByRole('img', { name: /Reservas por dia.*Sex: 7 reservas/ })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Ver financeiro' })).toHaveAttribute('href', '#financial')
  expect(screen.getByRole('link', { name: 'Abrir agenda completa' })).toHaveAttribute('href', '#availability')
  expect(api.mount).not.toHaveBeenCalled()
  expect(screen.getAllByText('<img src=x onerror=alert(1)>')).toHaveLength(6)
  expect(document.querySelector('td img')).toBeNull()
})

test('usuário vê apenas sua agenda e trata contato ausente ou configurado', async () => {
  const { api, snapshot } = fixture('user')
  render(<DashboardHome api={api} />)
  expect(await screen.findByRole('heading', { name: 'Meus próximos horários' })).toBeVisible()
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
  expect(screen.queryByText('Situação financeira')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Ver financeiro' })).not.toBeInTheDocument()
  expect(screen.getByText('Não configurado')).toBeVisible()
  snapshot.whatsapp = '11999999999'
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'app_settings' })))
  expect(await screen.findByRole('link', { name: /Fale conosco/ })).toHaveAttribute('href', expect.stringContaining('https://wa.me/5511999999999'))
})

test('listas vazias não geram barras inválidas e atualização externa não refaz o foco', async () => {
  const { api, snapshot } = fixture()
  snapshot.schedules = []
  snapshot.accounts = []
  const { unmount } = render(<DashboardHome api={api} />)
  expect(await screen.findByText('Nenhuma reserva nesta semana.')).toBeVisible()
  expect(screen.getByText('Nenhuma conta cadastrada.')).toBeVisible()
  expect(document.querySelectorAll('[style*="NaN"]')).toHaveLength(0)
  expect(window.scrollTo).toHaveBeenCalledTimes(1)
  await act(async () => window.dispatchEvent(new Event('focus')))
  expect(window.scrollTo).toHaveBeenCalledTimes(1)
  const count = vi.mocked(api.readDashboard).mock.calls.length
  unmount()
  await act(async () => window.dispatchEvent(new Event('focus')))
  expect(api.readDashboard).toHaveBeenCalledTimes(count)
})

test('erro de leitura mostra nova tentativa e recupera o dashboard', async () => {
  const { api } = fixture()
  vi.mocked(api.readDashboard).mockImplementationOnce(() => { throw new Error('blocked') })
  render(<DashboardHome api={api} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar esta página.')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('heading', { name: 'Olá, Teste' })).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
