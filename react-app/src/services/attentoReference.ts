import type { Professional, Room, Schedule } from './models'
import { dateKey } from './dates'

export const referenceUnits = [{ id: 'horizonte', name: 'Horizonte Jardins' }, { id: 'europa', name: 'Jardim Europa' }]
export const referenceRooms: Room[] = [
  ['duna', 'Duna', 'horizonte', null, ''],
  ['mare', 'Maré', 'horizonte', null, ''],
  ['costa', 'Costa', 'horizonte', null, ''],
  ['onda', 'Onda', 'europa', 9.35, 'Sala do meio do corredor'],
  ['areia', 'Areia', 'europa', 9.84, 'Sala reta entrando no espaço'],
  ['brisa', 'Brisa', 'europa', 8, 'Sala menor, ao lado do banheiro'],
  ['mar', 'Mar', 'europa', 10.08, ''],
  ['estrela', 'Estrela', 'europa', 10.67, 'Sala maior, do canto do espaço. Uso exclusivo: Poliana Reis.'],
].map(([id, name, unitId, area, description]) => ({ id: String(id), name: String(name), unitId: String(unitId), capacity: null, areaM2: typeof area === 'number' ? area : undefined, description: String(description), status: 'disponivel', shiftPrices: unitId === 'horizonte' ? { morning: 300, afternoon: 330, night: 300 } : { morning: 350, afternoon: 450, night: 350 } }))

type Pattern = { roomId: string; days: number[]; start: number; end: number; name: string; note: string }
const patterns: Pattern[] = []
function fixed(roomId: string, days: number[], start: number, end: number, name: string, note = 'Turno fixo') { patterns.push({ roomId, days, start, end, name, note }) }
fixed('duna', [1], 14, 18, 'BEATRIZ')
fixed('duna', [3], 14, 18, 'JOSÉ')
fixed('duna', [3], 18, 19, 'JOSÉ', 'Hora extra fixa')
fixed('mare', [2, 3], 8, 12, 'MARLENE')
fixed('mare', [2, 3], 12, 14, 'MARLENE', 'Hora extra fixa')
fixed('mare', [2, 3], 14, 18, 'MARLENE')
fixed('mare', [2], 18, 22, 'FELIPE SANTOS')
fixed('costa', [0, 1, 2, 3, 4], 8, 12, 'BEATRIZ')
fixed('costa', [4], 12, 13, 'MARLENE', 'Hora fixa')
fixed('costa', [0], 14, 18, 'JOSÉ')
fixed('costa', [0], 18, 22, 'JOSÉ')
fixed('costa', [1, 2], 14, 18, 'BEATRIZ')
fixed('costa', [3], 14, 18, 'BIANCA')
fixed('costa', [4], 14, 18, 'MARLENE')
fixed('onda', [0], 8, 12, 'MARIA LUIZA')
fixed('onda', [0], 12, 14, 'MARIA LUIZA', 'Horas fixas')
fixed('onda', [0], 14, 18, 'MARIA LUIZA')
fixed('onda', [2], 8, 12, 'MARCELA SÁ')
fixed('onda', [2], 12, 13, 'MARCELA SÁ', 'Hora avulsa fixa')
fixed('onda', [1], 13, 14, 'MARCELA SÁ', 'Hora avulsa fixa')
fixed('onda', [1], 14, 18, 'MARCELA SÁ')
fixed('onda', [4], 8, 12, 'JOÃO LUCAS')
fixed('onda', [2], 14, 18, 'DR. JAILTON')
fixed('onda', [3], 14, 18, 'GUIMARÃES')
fixed('areia', [3], 8, 12, 'MATHEUS MENEZES')
fixed('areia', [5], 8, 12, 'GABRIEL VIEIRA')
fixed('areia', [0, 1, 4], 14, 18, 'GABRIEL VIEIRA')
fixed('areia', [2], 14, 18, 'SONIA')
fixed('areia', [3], 14, 18, 'ISADORA SAMPAIO')
fixed('areia', [0, 1], 18, 22, 'GABRIEL VIEIRA')
fixed('brisa', [1, 3], 8, 12, 'ROGÉRIO FONTES')
fixed('brisa', [1], 14, 18, 'CARLA BAERRETO')
fixed('brisa', [3], 14, 18, 'LÚCIA RALIN')
fixed('brisa', [4], 14, 18, 'CAMILA RODRIGUES')
fixed('mar', [0], 8, 12, 'FELIPE')
fixed('mar', [1], 8, 12, 'MÁRCIA MENEEZS')
fixed('mar', [3], 8, 12, 'MEIRE FRANÇA')
fixed('mar', [4], 8, 12, 'MARCELLA PRADO')
fixed('mar', [4], 12, 13, 'MARCELLA PRADO', 'Hora fixa')
fixed('mar', [1, 2, 4], 14, 18, 'MÁRCIA MENEEZS')
fixed('mar', [3], 14, 18, 'MEIRE FRANÇA')
fixed('estrela', [0, 1, 2, 3, 4, 5, 6], 8, 22, 'POLIANA REIS', 'Sala exclusiva')

const professionalId = (name: string) => 'reference_' + name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
export const referenceProfessionals: Professional[] = [...new Set(patterns.map(item => item.name))].map(name => {
  const pattern = patterns.find(item => item.name === name)!
  return { id: professionalId(name), name, specialty: '', unitId: referenceRooms.find(room => room.id === pattern.roomId)!.unitId, roomId: pattern.roomId, shift: 'Conforme grade fixa', value: 0, status: 'ativo' }
})

export function fixedSchedules(month: string): Schedule[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return []
  const result: Schedule[] = []
  const date = new Date(month + '-01T00:00:00')
  while (dateKey(date).slice(0, 7) === month) {
    patterns.forEach((pattern, index) => {
      const room = referenceRooms.find(item => item.id === pattern.roomId)!
      if (month < (room.unitId === 'horizonte' ? '2026-07' : '2026-09') || !pattern.days.includes((date.getDay() + 6) % 7)) return
      const time = (hour: number) => String(hour).padStart(2, '0') + ':00'
      result.push({ id: 'fixed_' + index + '_' + dateKey(date), fixed: true, date: dateKey(date), time: time(pattern.start), endTime: time(pattern.end), roomId: room.id, unitId: room.unitId, professionalId: professionalId(pattern.name), userId: null, shift: pattern.start === 8 ? 'Manhã' : pattern.start === 14 ? 'Tarde' : pattern.start === 18 ? 'Noite' : 'Hora fixa', value: 0, note: pattern.note, status: 'reservado' })
    })
    date.setDate(date.getDate() + 1)
  }
  return result
}
export function hasFixedLink(id: string) { return patterns.some(item => item.roomId === id || professionalId(item.name) === id) }