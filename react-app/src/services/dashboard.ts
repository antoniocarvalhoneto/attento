import * as data from './dates'
import { whatsappUrl } from './contact'
import type { User } from './auth'

type NamedRecord = { id: string; name: string; status?: string }
export type Reservation = {
  id: string; date: string; time: string; status: string
  roomId: string; unitId: string; professionalId: string | null; userId: string | null
}
export type DashboardSnapshot = {
  user: User; rooms: NamedRecord[]; professionals: NamedRecord[]; units: NamedRecord[]
  schedules: Reservation[]; accounts: { id: string; status: string }[]; whatsapp: string
}

export const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function displayDate(date: string) {
  return date ? date.split('-').reverse().join('/') : '—'
}

export function buildDashboard(snapshot: DashboardSnapshot, now = new Date()) {
  const isAdmin = snapshot.user.role === 'admin'
  const schedules = isAdmin ? snapshot.schedules : snapshot.schedules.filter(item => item.userId === snapshot.user.id)
  const nameOf = (items: NamedRecord[], id: string | null) => items.find(item => item.id === id)?.name || '—'
  const reservations = data.upcomingSchedules(schedules, now).map(item => ({
    id: item.id, date: displayDate(item.date), time: item.time,
    room: nameOf(snapshot.rooms, item.roomId), unit: nameOf(snapshot.units, item.unitId),
    professional: nameOf(snapshot.professionals, item.professionalId),
  }))
  const common = {
    name: snapshot.user.name.split(' ')[0],
    dateLabel: now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    availableRooms: snapshot.rooms.filter(item => item.status === 'disponivel').length,
    reservations,
  }
  if (!isAdmin) return {
    ...common, role: 'user' as const,
    weekReservations: data.upcomingSchedules(schedules, now).filter(item => data.inWeek(item, 0, now)).length,
    helpUrl: whatsappUrl(snapshot.whatsapp, 'Olá! Preciso de ajuda com meu acesso ou meus horários no Attento.'),
  }
  const weekCounts = WEEK_DAYS.map((_, day) => schedules.filter(item => item.status === 'reservado' && item.date === data.slotDate(0, day, now)).length)
  const chartStep = Math.max(1, Math.ceil(Math.max(...weekCounts) / 4))
  const finance = {
    paid: snapshot.accounts.filter(item => item.status === 'pago').length,
    pending: snapshot.accounts.filter(item => item.status === 'pendente').length,
    overdue: snapshot.accounts.filter(item => item.status === 'vencido').length,
  }
  return {
    ...common, role: 'admin' as const, finance,
    activeProfessionals: snapshot.professionals.filter(item => item.status === 'ativo').length,
    weekCounts, weekTotal: weekCounts.reduce((sum, count) => sum + count, 0),
    chartStep, chartMax: chartStep * 4, todayIndex: (now.getDay() + 6) % 7,
  }
}

export type DashboardModel = ReturnType<typeof buildDashboard>
