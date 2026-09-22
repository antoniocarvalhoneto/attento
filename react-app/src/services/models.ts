export type Unit = { id: string; name: string }
export type Room = Unit & { unitId: string; capacity: number | null; status: string; description: string; areaM2?: number; shiftPrices?: { morning: number; afternoon: number; night: number }; archived?: boolean }
export type Professional = Unit & { specialty: string; unitId: string; roomId: string; shift: string; value: number; status: string }
export type Schedule = { id: string; date: string; day?: number; week?: number; time: string; endTime?: string; fixed?: boolean; unitId: string; roomId: string; professionalId: string | null; userId: string | null; shift: string; value: number; note: string; status: string }
export type Account = { id: string; professionalId: string; description: string; value: number; dueDate: string; status: string; paymentDate: string | null }
export type Convenience = { id: string; productId: string; professionalId: string; quantity: number; unitValue: number; date: string; status: string }
export type Collections = { units: Unit[]; rooms: Room[]; professionals: Professional[]; schedules: Schedule[]; financial: Account[]; conveniences: Convenience[] }
export type Settings = { theme?: 'light' | 'dark'; whatsapp?: string }
export const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)
export const CONVENIENCE_PRODUCTS = [
  { id: 'coffee-capsule', name: 'Cápsula de café', price: 2 },
  { id: 'cappuccino', name: 'Cappuccino', price: 5 },
  { id: 'cookies', name: 'Biscoitos', price: 2 },
  { id: 'coffee-box', name: 'Caixa de café', price: 40 },
  { id: 'protein-bar', name: 'Barra de proteína', price: 6 },
  { id: 'chocolate', name: 'Chocolate', price: 2 },
  { id: 'print-bw', name: 'Impressão preto e branco', price: 2 },
  { id: 'copy-bw', name: 'Xerox preto e branco', price: 1.5 },
  { id: 'print-color', name: 'Impressão / xerox colorido', price: 3 },
]
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const nameOf = (items: Unit[], id: string | null) => items.find(item => item.id === id)?.name || '—'
