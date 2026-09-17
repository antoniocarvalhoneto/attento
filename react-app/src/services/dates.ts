type Dated = { date?: string; week?: number; day?: number; time?: string }
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function scheduleDate(schedule: Dated, now = new Date()) {
  const date = schedule.date ? new Date(schedule.date + 'T00:00:00') : new Date(now)
  if (!schedule.date) date.setDate(date.getDate() + (date.getDay() === 0 ? -6 : 1 - date.getDay()) + (schedule.week || 0) * 7 + (schedule.day || 0))
  const [hour, minute] = (schedule.time || '00:00').split(':').map(Number)
  date.setHours(hour, minute, 0, 0)
  return date
}
export function slotDate(week: number, day: number, now = new Date()) { return dateKey(scheduleDate({ week, day }, now)) }
export function migrateSchedules<T extends Dated>(items: T[], now = new Date()) { return items.map(item => ({ ...item, date: item.date || slotDate(item.week || 0, item.day || 0, now) })) }
export function inWeek(item: Dated, week: number, now = new Date()) { const date = item.date || dateKey(scheduleDate(item, now)); return date >= slotDate(week, 0, now) && date < slotDate(week + 1, 0, now) }
export function upcomingSchedules<T extends Dated & { status: string }>(items: T[], now = new Date()) { return items.filter(item => item.status === 'reservado' && scheduleDate(item, now) >= now).sort((a, b) => +scheduleDate(a, now) - +scheduleDate(b, now)) }
export function weekRangeLabel(week: number) { return [0, 5].map(day => scheduleDate({ week, day }).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })).join(' a ') }
export function slotUnavailableReason(room: { id: string; status: string } | undefined, schedules: { roomId: string; date: string; time: string; status: string }[], date: string, time: string, now = new Date()) {
  if (!room || room.status !== 'disponivel') return 'Esta sala não está disponível para reservas.'
  const slot = scheduleDate({ date, time })
  if (!Number.isFinite(+slot) || slot <= now) return 'Este horário já passou ou é inválido.'
  if (schedules.some(item => item.roomId === room.id && item.date === date && item.time === time && item.status !== 'disponivel')) return 'Este horário já está reservado ou indisponível.'
  return ''
}
