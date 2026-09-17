import { expect, test } from 'vitest'
import { buildDashboard } from './dashboard'
import type { DashboardSnapshot, Reservation } from './dashboard'

const now = new Date(2026, 8, 17, 12)
const reservation = (id: string, date: string, userId = 'u'): Reservation => ({ id, date, time: '14:00', userId, status: 'reservado', roomId: 'r', professionalId: 'p', unitId: 'unit' })
const snapshot: DashboardSnapshot = {
  user: { id: 'u', name: 'Nome Teste', email: 'u@example.com', role: 'admin' },
  rooms: [{ id: 'r', name: 'Sala', status: 'disponivel' }],
  professionals: [{ id: 'p', name: 'Profissional', status: 'ativo' }],
  units: [{ id: 'unit', name: 'Unidade' }],
  schedules: [reservation('past', '2026-09-14'), reservation('other', '2026-09-18', 'other'), reservation('today', '2026-09-17'), reservation('next', '2026-09-21')],
  accounts: [{ id: '1', status: 'pago' }, { id: '2', status: 'pendente' }, { id: '3', status: 'vencido' }],
  whatsapp: '11999999999',
}

test('admin conta a semana fixa incluindo o passado e ordena só próximas reservas', () => {
  const model = buildDashboard(snapshot, now)
  expect(model.role).toBe('admin')
  if (model.role !== 'admin') throw new Error('perfil')
  expect(model.weekCounts).toEqual([1, 0, 0, 1, 1, 0])
  expect(model.reservations.map(item => item.id)).toEqual(['today', 'other', 'next'])
  expect(model.finance).toEqual({ paid: 1, pending: 1, overdue: 1 })
  expect(model.activeProfessionals).toBe(1)
  expect(model.todayIndex).toBe(3)
  expect(buildDashboard(snapshot, new Date(2026, 8, 21)).reservations.map(item => item.id)).toEqual(['next'])
})

test('usuário recebe apenas suas reservas futuras sem dados financeiros', () => {
  const model = buildDashboard({ ...snapshot, user: { ...snapshot.user, role: 'user' } }, now)
  expect(model.role).toBe('user')
  if (model.role !== 'user') throw new Error('perfil')
  expect(model.reservations.map(item => item.id)).toEqual(['today', 'next'])
  expect(model.weekReservations).toBe(1)
  expect(model).not.toHaveProperty('finance')
  expect(model.helpUrl).toMatch(/^https:\/\/wa.me\/5511999999999\?text=/)
})

test('coleções vazias e referências ausentes têm valores seguros', () => {
  const model = buildDashboard({ ...snapshot, schedules: [], accounts: [] }, now)
  if (model.role !== 'admin') throw new Error('perfil')
  expect(model.chartMax).toBe(4)
  expect(model.weekTotal).toBe(0)
  expect(model.reservations).toEqual([])
  const missing = buildDashboard({ ...snapshot, rooms: [], professionals: [], units: [] }, now)
  expect(missing.reservations[0]).toMatchObject({ room: '—', professional: '—', unit: '—' })
})
