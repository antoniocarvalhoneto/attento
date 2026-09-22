import { Fragment, useState } from 'react'
import type { User } from '../services/auth'
import type { Collections } from '../services/models'
import { HOURS, money, nameOf } from '../services/models'
import { dateKey, endOfHour, monthWeeks, overlaps, slotUnavailableReason, weekDay } from '../services/dates'
import { fixedSchedules } from '../services/attentoReference'
import { WEEK_DAYS, displayDate } from '../services/dashboard'
import { reserveSlot } from '../services/repository'
import { whatsappUrl } from '../services/contact'
import { Page } from '../components/Page'
import type { PageData } from '../components/Page'
import { Modal } from '../components/Modal'
import { Field, FormActions, Options, PageHead, Select } from '../components/Fields'

type Slot = { roomId: string; date: string; time: string; endTime: string }
const shifts = [{ name: 'Manhã', time: '08:00', endTime: '12:00' }, { name: 'Tarde', time: '14:00', endTime: '18:00' }, { name: 'Noite', time: '18:00', endTime: '22:00' }]
export function AvailabilityPage({ user }: { user: User }) { return <Page>{(data, refresh) => <Availability data={data} refresh={refresh} user={user} />}</Page> }
function Availability({ data, refresh, user }: { data: PageData; refresh(): void; user: User }) {
  const [unit, setUnit] = useState('all'), [roomId, setRoom] = useState('all')
  const [month, setMonth] = useState(dateKey().slice(0, 7))
  const [week, setWeek] = useState(() => String(Math.max(0, monthWeeks(dateKey().slice(0, 7)).findIndex(start => dateKey() >= start && dateKey() <= weekDay(start, 6)))))
  const [mode, setMode] = useState('hours')
  const [slot, setSlot] = useState<Slot | null>(null), [confirmed, setConfirmed] = useState<Slot | null>(null)
  const weeks = monthWeeks(month), monday = weeks[Number(week)] || weeks[0]
  const selectable = data.rooms.filter(room => !room.archived && room.status !== 'inativa' && (unit === 'all' || room.unitId === unit))
  const rooms = selectable.filter(room => roomId === 'all' || room.id === roomId)
  const schedules = [...data.schedules, ...fixedSchedules(month)]
  const rows = mode === 'hours' ? HOURS.map(time => ({ name: time, time, endTime: endOfHour(time) })) : shifts
  const link = confirmed ? whatsappUrl(data.settings.whatsapp || '', 'Olá! Gostaria de confirmar o horário de ' + displayDate(confirmed.date) + ' das ' + confirmed.time + ' às ' + confirmed.endTime + ' na ' + nameOf(data.rooms, confirmed.roomId) + '.') : ''
  return <>
    <PageHead title="Disponibilidade das Salas" description={user.role === 'admin' ? 'Consulte os turnos fixos e selecione uma hora ou um turno livre para alocar.' : 'Selecione uma hora ou um turno disponível para reservar.'} />
    <div className="filter-bar">
      <Select id="f-unit" label="Unidade" value={unit} onChange={value => { setUnit(value); setRoom('all') }}><option value="all">Todas</option><Options items={data.units.filter(item => data.rooms.some(room => room.unitId === item.id && !room.archived))} /></Select>
      <Select label="Sala" value={roomId} onChange={setRoom}><option value="all">Todas</option><Options items={selectable} /></Select>
      <Field label="Mês" type="month" required value={month} onChange={event => { if (event.target.value) { setMonth(event.target.value); setWeek('0') } }} />
      <Select label="Semana" value={weeks[Number(week)] ? week : '0'} onChange={setWeek}>{weeks.map((start, index) => <option key={start} value={index}>{displayDate(start)} a {displayDate(weekDay(start, 5))}</option>)}</Select>
      <Select label="Visualização" value={mode} onChange={setMode}><option value="hours">Por hora</option><option value="shifts">Por turno</option></Select>
      <button className="btn btn-ghost btn-sm" onClick={() => { setUnit('all'); setRoom('all') }}>Limpar filtros de sala</button>
    </div>
    <p className="text-muted">Manhã 08–12h · Tarde 14–18h · Noite 18–22h. Horas de 12–14h na visualização por hora. Sábado: manhã. A grade fixa se repete nos meses seguintes.</p>
    <div className="agenda-legend"><span>Livre: selecione para reservar</span><span>Fixo: ocupação da planilha</span><span>Reservado: alocação avulsa</span></div>
    {!rooms.length && <div className="empty-state"><p>Nenhuma sala encontrada com os filtros atuais.</p></div>}
    {monday && rooms.map(room => <section className="section" key={room.id}>
      <div className="section-head"><h2>{room.name} <span className="text-muted">— {nameOf(data.units, room.unitId)}</span></h2></div>
      {room.shiftPrices && <p className="text-muted">Referência dos turnos fixos: manhã {money(room.shiftPrices.morning)} · tarde {money(room.shiftPrices.afternoon)} · noite {money(room.shiftPrices.night)}. Valores avulsos a combinar.</p>}
      <div className="agenda-wrap" role="region" aria-label={'Agenda de ' + room.name} tabIndex={0}><div className="agenda-grid">
        <div className="agenda-corner" />{WEEK_DAYS.map((day, index) => <div className="agenda-head" key={day}>{day}<br /><small>{displayDate(weekDay(monday, index))}</small></div>)}
        {rows.map(row => <Fragment key={row.time}><div className="agenda-time">{row.name}{mode === 'shifts' && <small><br />{row.time}–{row.endTime}</small>}</div>{WEEK_DAYS.map((day, index) => {
          const date = weekDay(monday, index)
          const reservations = schedules.filter(item => item.roomId === room.id && item.date === date && item.status !== 'disponivel' && overlaps(row.time, row.endTime, item))
          const outside = date.slice(0, 7) !== month
          const reason = outside ? 'Fora do mês selecionado.' : slotUnavailableReason(room, schedules, date, row.time, new Date(), row.endTime)
          const status = room.status === 'manutencao' ? 'manutencao' : reservations.length ? 'reservado' : reason ? 'ocupado' : 'disponivel'
          const names = [...new Set(reservations.map(item => nameOf(data.professionals, item.professionalId)))].join(', ')
          const label = outside ? '—' : reservations.length ? (reservations.some(item => item.fixed) ? 'Fixo' : 'Reservado') : status === 'manutencao' ? 'Manutenção' : reason ? 'Indisponível' : 'Livre'
          return <button type="button" key={day} className={'agenda-cell ' + status} disabled={!!reason} title={user.role === 'admin' && reservations.length ? reservations.map(item => nameOf(data.professionals, item.professionalId) + ' · ' + item.time + '–' + (item.endTime || endOfHour(item.time)) + ' · ' + item.note).join('; ') : reason || 'Reservar horário'} aria-label={(reason || 'Horário disponível') + ' ' + room.name + ' ' + day + ' ' + displayDate(date) + ' ' + row.time} onClick={() => setSlot({ roomId: room.id, date, time: row.time, endTime: row.endTime })}><span className="agenda-cell-label">{label}{!outside && user.role === 'admin' && reservations.length > 0 && <><br />{names}</>}</span></button>
        })}</Fragment>)}
      </div></div>
    </section>)}
    {slot && <ReserveDialog data={data} slot={slot} user={user} onClose={() => setSlot(null)} onSaved={() => { setSlot(null); if (user.role === 'user') setConfirmed(slot); refresh() }} />}
    {confirmed && <Modal title="Horário confirmado" onClose={() => setConfirmed(null)}><div className="modal-body"><p>Seu horário foi reservado. {link ? 'Você pode confirmar diretamente pelo WhatsApp com a unidade.' : 'O contato da unidade ainda não foi configurado.'}</p></div><div className="modal-foot"><button className="btn btn-secondary" onClick={() => setConfirmed(null)}>Concluir</button>{link && <a className="btn btn-primary" href={link} target="_blank" rel="noopener noreferrer">Falar pelo WhatsApp</a>}</div></Modal>}
  </>
}
function ReserveDialog({ data, slot, user, onClose, onSaved }: { data: Collections; slot: Slot; user: User; onClose(): void; onSaved(): void }) {
  const [professionalId, setProfessional] = useState(''), [value, setValue] = useState('0'), [note, setNote] = useState(''), [error, setError] = useState('')
  const admin = user.role === 'admin'
  const shift = shifts.find(item => item.time === slot.time && item.endTime === slot.endTime)?.name || 'Hora avulsa'
  return <Modal title={admin ? 'Alocar profissional' : 'Selecionar horário'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { reserveSlot({ ...slot, professionalId, value: Number(value), shift, note }); onSaved() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body">
    <p>{nameOf(data.rooms, slot.roomId)} · {displayDate(slot.date)} · {slot.time}–{slot.endTime} · {shift}</p>
    {admin ? <><Select label="Profissional" required value={professionalId} onChange={setProfessional}><option value="">Selecione</option><Options items={data.professionals.filter(item => item.status === 'ativo')} /></Select><Field label="Valor combinado (R$)" type="number" min="0" step="0.01" value={value} onChange={event => setValue(event.target.value)} /><p className="text-muted">Zero indica valor ainda não definido. A reserva não gera uma conta automaticamente.</p><Field label="Observação" value={note} onChange={event => setNote(event.target.value)} /></> : <p>Reserva vinculada à sua conta. Valor a combinar com a unidade.</p>}
    {error && <p role="alert">{error}</p>}
  </div><FormActions onClose={onClose} label={admin ? 'Confirmar alocação' : 'Confirmar horário'} /></form></Modal>
}