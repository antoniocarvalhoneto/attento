export type Unit = { id: string; name: string }
export type Room = Unit & { unitId: string; capacity: number; status: string; description: string }
export type Professional = Unit & { specialty: string; unitId: string; roomId: string; shift: string; value: number; status: string }
export type Schedule = { id: string; date: string; day?: number; week?: number; time: string; unitId: string; roomId: string; professionalId: string | null; userId: string | null; shift: string; value: number; note: string; status: string }
export type Account = { id: string; professionalId: string; description: string; value: number; dueDate: string; status: string; paymentDate: string | null }
export type Insurance = { id: string; insuranceType: string; professionalId: string; quantity: number; unitValue: number; status: string }
export type Collections = { units: Unit[]; rooms: Room[]; professionals: Professional[]; schedules: Schedule[]; financial: Account[]; insurance: Insurance[] }
export type Settings = { theme?: 'light' | 'dark'; whatsapp?: string }
export const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)
export const INSURANCE_TYPES = ['Unimed', 'Bradesco Saúde', 'Amil', 'SulAmérica', 'Particular']
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const nameOf = (items: Unit[], id: string | null) => items.find(item => item.id === id)?.name || '—'
