import { KEYS, loadData, saveData } from './storage'
import type { Professional, Room, Unit } from './models'
import { referenceProfessionals, referenceRooms, referenceUnits } from './attentoReference'

export function initializeData() {
  if (!loadData('app_attento_reference_v1')) {
    const units = loadData<Unit[]>(KEYS.units) || []
    const rooms = loadData<Room[]>(KEYS.rooms) || []
    const professionals = loadData<Professional[]>(KEYS.professionals) || []
    if (![units, rooms, professionals].every(Array.isArray)) throw new Error('Cadastros inválidos. A importação foi interrompida.')
    if (!loadData('app_before_attento_reference')) saveData('app_before_attento_reference', { units, rooms, professionals })
    const merge = <T extends { id: string }>(current: T[], reference: T[]) => [...current, ...reference.filter(item => !current.some(existing => existing.id === item.id))]
    saveData(KEYS.units, merge(units, referenceUnits))
    saveData(KEYS.rooms, merge(rooms.map(room => /^room_[1-6]$/.test(room.id) && /^Sala 0[1-6]$/.test(room.name) ? { ...room, archived: true } : room), referenceRooms))
    saveData(KEYS.professionals, merge(professionals, referenceProfessionals))
    saveData('app_attento_reference_v1', true)
  }
  for (const key of [KEYS.schedules, KEYS.financial, KEYS.conveniences]) if (!loadData(key)) saveData(key, [])
  if (!loadData(KEYS.settings)) saveData(KEYS.settings, { theme: 'light' })
}