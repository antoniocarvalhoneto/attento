import { expect, test, vi } from 'vitest'
import { initializeData } from './seed'
import { fixedSchedules, referenceRooms } from './attentoReference'
import { createAuth } from './auth'
import { readData, reserveSlot } from './repository'

test('instala oito salas e preserva dados anteriores sem duplicar importação', () => {
  localStorage.setItem('app_rooms', JSON.stringify([{ id: 'custom', name: 'Minha sala' }, { id: 'room_1', name: 'Sala 01' }]))
  localStorage.setItem('app_schedules', JSON.stringify([{ id: 'saved' }]))
  localStorage.setItem('app_insurance', '[{"id":"old"}]')
  initializeData(); initializeData()
  const rooms = JSON.parse(localStorage.getItem('app_rooms')!)
  expect(rooms).toHaveLength(10)
  expect(rooms[0]).toEqual({ id: 'custom', name: 'Minha sala' })
  expect(rooms[1].archived).toBe(true)
  expect(localStorage.getItem('app_schedules')).toBe('[{"id":"saved"}]')
  expect(localStorage.getItem('app_insurance')).toBe('[{"id":"old"}]')
  expect(localStorage.getItem('app_conveniences')).toBe('[]')
  expect(referenceRooms.filter(item => item.unitId === 'europa')).toHaveLength(5)
  expect(referenceRooms.every(item => item.capacity === null)).toBe(true)
})

test('falha ao gravar não marca migração concluída', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  expect(initializeData).toThrow('Não foi possível salvar')
  expect(localStorage.getItem('app_attento_reference_v1')).toBeNull()
})

test('grades iniciam no mês de origem e repetem extras e exclusividade no futuro', () => {
  expect(fixedSchedules('2026-06')).toEqual([])
  expect(fixedSchedules('2026-07').every(item => item.unitId === 'horizonte')).toBe(true)
  const future = fixedSchedules('2027-01')
  expect(future.filter(item => item.roomId === 'estrela')).toHaveLength(31)
  expect(future.find(item => item.roomId === 'duna' && item.date === '2027-01-07' && item.time === '18:00')).toMatchObject({ endTime: '19:00', note: 'Hora extra fixa' })
  expect(future.find(item => item.roomId === 'onda' && item.date === '2027-01-05' && item.time === '13:00')).toMatchObject({ endTime: '14:00', professionalId: 'reference_marcela_sa' })
  expect(future.every(item => item.value === 0 && item.fixed)).toBe(true)
})

test('reserva avulsa não sobrepõe turno fixo, extra ou sala exclusiva', () => {
  createAuth().signIn('admin@demo.com', '123456')
  readData()
  const input = { roomId: 'duna', date: '2099-01-08', time: '17:00', endTime: '19:00', professionalId: 'reference_beatriz' }
  expect(() => reserveSlot(input)).toThrow('indisponível')
  expect(() => reserveSlot({ ...input, roomId: 'estrela', time: '08:00', endTime: '12:00' })).toThrow('indisponível')
  reserveSlot({ ...input, date: '2099-01-05', time: '08:00', endTime: '12:00' })
  expect(() => reserveSlot({ ...input, date: '2099-01-05', time: '11:00', endTime: '12:00' })).toThrow('indisponível')
  expect(readData().schedules).toHaveLength(1)
  expect(readData().financial).toEqual([])
})
