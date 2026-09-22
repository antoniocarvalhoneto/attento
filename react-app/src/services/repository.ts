import { createAuth } from './auth'
import { initializeData } from './seed'
import { KEYS, loadData, saveData, uid } from './storage'
import { dateKey, migrateSchedules, slotUnavailableReason } from './dates'
import type { Collections, Schedule, Settings } from './models'
import { CONVENIENCE_PRODUCTS } from './models'
import { fixedSchedules, hasFixedLink } from './attentoReference'

export function requireUser(admin = false) {
  const user = createAuth().restoreSession()
  if (!user || (admin && user.role !== 'admin')) throw new Error('Acesso não permitido. Entre novamente.')
  return user
}
export function readCollection<K extends keyof Collections>(key: K): Collections[K] {
  const records = loadData<Collections[K]>(KEYS[key])
  if (!Array.isArray(records)) throw new Error('Não foi possível ler os registros. Verifique o armazenamento.')
  return records
}
export function readData(): Collections {
  requireUser()
  initializeData()
  const schedules = readCollection('schedules')
  if (schedules.some(item => !item.date)) saveData(KEYS.schedules, migrateSchedules(schedules))
  return { units: readCollection('units'), rooms: readCollection('rooms'), professionals: readCollection('professionals'), schedules: readCollection('schedules'), financial: requireUser().role === 'admin' ? readCollection('financial') : [], conveniences: requireUser().role === 'admin' ? readCollection('conveniences') : [] }
}
export function readSettings() { return loadData<Settings>(KEYS.settings) || {} }
type Editable = 'rooms' | 'professionals' | 'financial' | 'conveniences'
export function saveRecord<K extends Editable>(key: K, record: Collections[K][number]) {
  requireUser(true)
  const current = readCollection(key) as Collections[K][number][]
  const data = readData()
  if ('productId' in record && (!CONVENIENCE_PRODUCTS.some(item => item.id === record.productId) || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !Number.isInteger(record.quantity))) throw new Error('Informe conveniência, data e quantidade inteira válidas.')
  if ('name' in record && !record.name.trim()) throw new Error('Informe o nome.')
  if ('professionalId' in record && !('kind' in record && record.kind === 'payable' && !record.professionalId) && !data.professionals.some(item => item.id === record.professionalId)) throw new Error('Selecione um profissional válido.')
  if ('unitId' in record && !(key === 'financial' && !record.unitId) && !data.units.some(item => item.id === record.unitId)) throw new Error('Selecione uma unidade válida.')
  if ('dueDate' in record && (!/^\d{4}-\d{2}-\d{2}$/.test(record.dueDate) || dateKey(new Date(record.dueDate + 'T00:00:00')) !== record.dueDate || (record.kind && !['payable', 'receivable'].includes(record.kind)))) throw new Error('Informe tipo e vencimento válidos.')
  if ('roomId' in record && !data.rooms.some(item => item.id === record.roomId)) throw new Error('Selecione uma sala válida.')
  if ('description' in record && key === 'financial' && !record.description.trim()) throw new Error('Informe a descrição da conta.')
  for (const field of ['value', 'unitValue', 'quantity', 'capacity'] as const) {
    if (field in record) {
      if (field === 'capacity' && 'capacity' in record && record.capacity === null) continue
      const value = Number((record as unknown as Record<string, unknown>)[field])
      if (!Number.isFinite(value) || value < (field === 'quantity' || field === 'capacity' ? 1 : 0)) throw new Error('Informe valores numéricos válidos.')
    }
  }
  if (record.id && !current.some(item => item.id === record.id)) throw new Error('Este registro foi removido. Recarregue a página.')
  const next = { ...record, id: record.id || uid(key) }
  if (key === 'financial' && 'paymentDate' in next) next.paymentDate = next.status === 'pago' ? next.paymentDate || dateKey() : null
  saveData(KEYS[key], record.id ? current.map(item => item.id === record.id ? next : item) : [...current, next])
}
export function deleteRecord(key: Editable, id: string) {
  requireUser(true)
  const data = readData()
  const linked = key === 'rooms' ? data.professionals.some(item => item.roomId === id) || data.schedules.some(item => item.roomId === id)
    : key === 'professionals' && [...data.schedules, ...data.financial, ...data.conveniences].some(item => item.professionalId === id)
  if (linked || ((key === 'rooms' || key === 'professionals') && hasFixedLink(id))) throw new Error('Este cadastro possui registros vinculados. Inative-o para preservar o histórico.')
  saveData(KEYS[key], data[key].filter(item => item.id !== id))
}
export function markPaid(key: 'financial' | 'conveniences', id: string) {
  requireUser(true)
  if (key === 'financial') {
    const item = readCollection(key).find(item => item.id === id)
    if (!item) throw new Error('Conta não encontrada.')
    saveRecord(key, { ...item, status: 'pago', paymentDate: dateKey() })
  } else {
    const item = readCollection(key).find(item => item.id === id)
    if (!item) throw new Error('Registro não encontrado.')
    saveRecord(key, { ...item, status: 'pago' })
  }
}
export function reserveSlot(input: Pick<Schedule, 'roomId' | 'date' | 'time'> & Partial<Pick<Schedule, 'professionalId' | 'value' | 'note' | 'shift' | 'endTime'>>) {
  const user = requireUser()
  const data = readData()
  const room = data.rooms.find(item => item.id === input.roomId)
  const reason = slotUnavailableReason(room, [...data.schedules, ...fixedSchedules(input.date.slice(0, 7))], input.date, input.time, new Date(), input.endTime)
  if (reason || !room) throw new Error(reason)
  const active = data.professionals.filter(item => item.status === 'ativo')
  const professional = user.role === 'admin' ? active.find(item => item.id === input.professionalId) : undefined
  if (user.role === 'admin' && !professional) throw new Error('Selecione um profissional ativo.')
  const value = user.role === 'admin' ? Number(input.value || 0) : 0
  if (!Number.isFinite(value) || value < 0) throw new Error('Informe um valor válido.')
  const item: Schedule = { id: uid('sch'), date: input.date, time: input.time, endTime: input.endTime, roomId: room.id, unitId: room.unitId, professionalId: professional?.id || null, userId: user.role === 'user' ? user.id : null, shift: input.shift || '', value, note: input.note?.trim() || '', status: 'reservado' }
  saveData(KEYS.schedules, [...data.schedules, item])
  return item
}
