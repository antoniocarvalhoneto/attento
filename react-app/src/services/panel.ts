import type { User } from './auth'
import type { DashboardSnapshot } from './dashboard'
import { readData, readSettings, requireUser } from './repository'

export type Theme = 'light' | 'dark'
export type NavItem = { key: string; label: string; icon: string }
export const navigation: Record<User['role'], NavItem[]> = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
    { key: 'availability', label: 'Disponibilidade das Salas', icon: 'fa-calendar-days' },
    { key: 'rooms', label: 'Salas', icon: 'fa-door-open' },
    { key: 'professionals', label: 'Profissionais', icon: 'fa-users' },
    { key: 'financial', label: 'Contas / Financeiro', icon: 'fa-wallet' },
    { key: 'insurance', label: 'Convênios', icon: 'fa-handshake' },
    { key: 'reports', label: 'Relatórios', icon: 'fa-chart-line' },
    { key: 'settings', label: 'Configurações', icon: 'fa-gear' },
  ],
  user: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
    { key: 'availability', label: 'Disponibilidade das Salas', icon: 'fa-calendar-days' },
    { key: 'myschedule', label: 'Meus Horários', icon: 'fa-clock' },
    { key: 'settings', label: 'Configurações', icon: 'fa-gear' },
  ],
}
export const titles: Record<string, string> = Object.fromEntries(Object.values(navigation).flat().map(item => [item.key, item.label]))
export function allowed(view: string, role: User['role']) { return navigation[role]?.some(item => item.key === view) || false }
export function readDashboard(): DashboardSnapshot {
  const user = requireUser(), data = readData()
  return { user, rooms: data.rooms, units: data.units, professionals: data.professionals, schedules: user.role === 'admin' ? data.schedules : data.schedules.filter(item => item.userId === user.id), accounts: data.financial, whatsapp: readSettings().whatsapp || '' }
}
export const panel = { readDashboard, navigation, titles, allowed }
export type PanelApi = typeof panel