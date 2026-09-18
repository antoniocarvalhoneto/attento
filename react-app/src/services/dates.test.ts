import { expect, test } from 'vitest'
import { dateKey, inWeek, migrateSchedules, scheduleDate, slotDate, slotUnavailableReason, upcomingSchedules } from './dates'
import { normalizeWhatsApp, whatsappUrl } from './contact'

test('datas fixas sobrevivem à virada de semana e ano sem mover o calendário local', () => {
  const migrated = migrateSchedules([{ week: 1, day: 0, time: '09:00', status: 'reservado' }], new Date(2026, 11, 30))
  expect(migrated[0].date).toBe('2027-01-04')
  expect(migrateSchedules(migrated, new Date(2027, 0, 12))[0].date).toBe('2027-01-04')
  expect(inWeek(migrated[0], 0, new Date(2027, 0, 4))).toBe(true)
  expect(inWeek(migrated[0], 0, new Date(2027, 0, 12))).toBe(false)
  expect(dateKey(new Date(2026, 8, 15, 23, 59))).toBe('2026-09-15')
  expect(slotDate(0, 0, new Date(2026, 8, 20))).toBe('2026-09-14')
  expect(scheduleDate({ date: '2026-09-21', time: '09:30' }).getMinutes()).toBe(30)
})
test('disponibilidade bloqueia horário passado, manutenção, inatividade e conflito', () => {
  const room = { id: 'r', status: 'disponivel' }, now = new Date(2026, 8, 16, 12)
  expect(slotUnavailableReason(room, [], '2026-09-16', '13:00', now)).toBe('')
  expect(slotUnavailableReason(room, [], '2026-09-16', '12:00', now)).not.toBe('')
  for (const status of ['inativa', 'manutencao']) expect(slotUnavailableReason({ ...room, status }, [], '2026-09-17', '13:00', now)).not.toBe('')
  const records = [{ roomId: 'r', date: '2026-09-17', time: '13:00', status: 'reservado' }]
  expect(slotUnavailableReason(room, records, '2026-09-17', '13:00', now)).not.toBe('')
  expect(slotUnavailableReason({ ...room, id: 'other' }, records, '2026-09-17', '13:00', now)).toBe('')
})
test('horários futuros excluem passado e ocupados e ficam ordenados', () => {
  const records = [
    { date: '2026-09-21', time: '08:00', status: 'reservado' },
    { date: '2026-09-15', time: '11:00', status: 'reservado' },
    { date: '2026-09-15', time: '13:00', status: 'ocupado' },
    { date: '2026-09-15', time: '14:00', status: 'reservado' },
  ]
  expect(upcomingSchedules(records, new Date(2026, 8, 15, 12))).toEqual([records[3], records[0]])
})
test('contato aceita DDD ou número internacional e codifica mensagem', () => {
  expect(normalizeWhatsApp('(11) 99999-9999')).toBe('5511999999999')
  expect(normalizeWhatsApp('+351 912 345 678')).toBe('351912345678')
  expect(whatsappUrl('123', 'Olá')).toBe('')
  expect(whatsappUrl('11999999999', 'Olá & confirmação')).toBe('https://wa.me/5511999999999?text=Ol%C3%A1%20%26%20confirma%C3%A7%C3%A3o')
})
