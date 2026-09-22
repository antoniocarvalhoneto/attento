import { beforeEach, expect, test, vi } from 'vitest'
import { createAuth } from './auth'
import { readData, reserveSlot, saveRecord, deleteRecord, markPaid } from './repository'
import { slotDate } from './dates'

beforeEach(() => { createAuth().signIn('admin@demo.com', '123456'); readData() })

test('preserva registros e migra datas antigas uma única vez', () => {
  localStorage.setItem('app_schedules', JSON.stringify([{ id: 'old', week: 1, day: 2, time: '10:00', status: 'reservado' }]))
  expect(readData().schedules[0].date).toBe(slotDate(1, 2))
  const persisted = localStorage.getItem('app_schedules')
  readData()
  expect(localStorage.getItem('app_schedules')).toBe(persisted)
})

test('revalida conflitos e sala na confirmação sem perder reservas existentes', () => {
  localStorage.setItem('app_schedules', '[]')
  const input = { roomId: 'duna', date: slotDate(1, 0), time: '10:00', professionalId: 'reference_beatriz' }
  reserveSlot(input)
  expect(() => reserveSlot(input)).toThrow('indisponível')
  saveRecord('rooms', { ...readData().rooms.find(room => room.id === 'mare')!, status: 'manutencao' })
  expect(() => reserveSlot({ ...input, roomId: 'mare' })).toThrow('não está disponível')
  expect(readData().schedules).toHaveLength(1)
})

test('bloqueia exclusão vinculada e não altera dados quando gravação falha', () => {
  expect(() => deleteRecord('rooms', 'duna')).toThrow('vinculados')
  const before = localStorage.getItem('app_rooms')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  expect(() => saveRecord('rooms', { ...readData().rooms[0], name: 'Alterada' })).toThrow('Não foi possível salvar')
  expect(localStorage.getItem('app_rooms')).toBe(before)
})

test('pagamento grava data e usuário comum não altera cadastros nem acessa financeiro', () => {
  saveRecord('financial', { id: '', professionalId: 'reference_beatriz', description: 'Aluguel', value: 300, dueDate: '2026-09-30', status: 'pendente', paymentDate: null })
  const id = readData().financial[0].id
  markPaid('financial', id)
  expect(readData().financial.find(item => item.id === id)?.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  createAuth().signIn('usuario@demo.com', '123456')
  expect(readData().financial).toEqual([])
  expect(() => deleteRecord('financial', id)).toThrow('Acesso não permitido')
})

test.each(['app_schedules', 'app_financial_accounts', 'app_conveniences'])('exclusão de profissional preserva vínculos em %s', key => {
  for (const name of ['app_schedules', 'app_financial_accounts', 'app_conveniences']) localStorage.setItem(name, '[]')
  localStorage.setItem(key, JSON.stringify([{ id: 'history', professionalId: 'reference_beatriz', date: '2020-01-01' }]))
  expect(() => deleteRecord('professionals', 'reference_beatriz')).toThrow('vinculados')
})

test('dados corrompidos interrompem leitura sem apagar o conteúdo original', () => {
  localStorage.setItem('app_rooms', '{')
  expect(() => readData()).toThrow()
  expect(localStorage.getItem('app_rooms')).toBe('{')
})
