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
export function endOfHour(time: string) { return String(Number(time.slice(0, 2)) + 1).padStart(2, '0') + ':00' }
export function overlaps(start: string, end: string, item: { time: string; endTime?: string }) { return start < (item.endTime || endOfHour(item.time)) && end > item.time }
export function monthWeeks(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return []
  const first = new Date(month + '-01T00:00:00'), weeks: string[] = []
  first.setDate(first.getDate() - (first.getDay() + 6) % 7)
  while (dateKey(first).slice(0, 7) <= month) { weeks.push(dateKey(first)); first.setDate(first.getDate() + 7) }
  return weeks
}
export function weekDay(monday: string, day: number) { const date = new Date(monday + 'T00:00:00'); date.setDate(date.getDate() + day); return dateKey(date) }
export function slotUnavailableReason(room: { id: string; status: string; archived?: boolean } | undefined, schedules: { roomId: string; date: string; time: string; endTime?: string; status: string }[], date: string, time: string, now = new Date(), endTime = endOfHour(time)) {
  if (!room || room.archived || room.status !== 'disponivel') return 'Esta sala não está disponível para reservas.'
  const slot = scheduleDate({ date, time })
  if (!Number.isFinite(+slot) || dateKey(slot) !== date || slot <= now || !/^(0[89]|1\d|2[01]):00$/.test(time) || !/^(09|1\d|2[0-2]):00$/.test(endTime) || endTime <= time) return 'Este horário já passou ou é inválido.'
  if (slot.getDay() === 0 || (slot.getDay() === 6 && endTime > '12:00')) return 'Fora do horário de funcionamento.'
  if (schedules.some(item => item.roomId === room.id && item.date === date && overlaps(time, endTime, item) && item.status !== 'disponivel')) return 'Este horário já está reservado ou indisponível.'
  return ''
}
