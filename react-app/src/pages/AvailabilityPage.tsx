import { Fragment, useState } from 'react'
import type { User } from '../services/auth'
import type { Collections } from '../services/models'
import { HOURS, money, nameOf } from '../services/models'
import { slotDate, slotUnavailableReason, weekRangeLabel } from '../services/dates'
import { WEEK_DAYS, displayDate } from '../services/dashboard'
import { readSettings, reserveSlot } from '../services/repository'
import { whatsappUrl } from '../services/contact'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { Field, FormActions, Options, PageHead, Select } from '../components/Fields'

type Slot = { roomId: string; date: string; time: string }
export function AvailabilityPage({ user }: { user: User }) { return <Page>{(data, refresh) => <Availability data={data} refresh={refresh} user={user} />}</Page> }
function Availability({ data, refresh, user }: { data: Collections; refresh(): void; user: User }) {
  const [unit, setUnit] = useState('all'), [roomId, setRoom] = useState('all'), [week, setWeek] = useState('0')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [confirmed, setConfirmed] = useState<Slot | null>(null)
  const rooms = data.rooms.filter(room => room.status !== 'inativa' && (unit === 'all' || room.unitId === unit) && (roomId === 'all' || room.id === roomId))
  const link = confirmed ? whatsappUrl(readSettings().whatsapp || '', `Olá! Gostaria de confirmar o horário de ${displayDate(confirmed.date)} às ${confirmed.time} na ${nameOf(data.rooms, confirmed.roomId)}.`) : ''
  return <>
    <PageHead title="Disponibilidade das Salas" description={user.role === 'admin' ? 'Clique em um horário disponível para alocar um profissional.' : 'Clique em um horário disponível para reservar.'} />
    <div className="filter-bar"><Select id="f-unit" label="Unidade" value={unit} onChange={setUnit}><option value="all">Todas</option><Options items={data.units} /></Select><Select label="Sala" value={roomId} onChange={setRoom}><option value="all">Todas</option><Options items={data.rooms} /></Select><Select label="Semana" value={week} onChange={setWeek}><option value="0">Semana atual</option><option value="1">Próxima semana</option></Select><p className="filter-context">{weekRangeLabel(Number(week))}</p><button className="btn btn-ghost btn-sm" onClick={() => { setUnit('all'); setRoom('all'); setWeek('0') }}>Limpar</button></div>
    <div className="agenda-legend">{['Disponível', 'Ocupado', 'Reservado', 'Manutenção'].map((label, index) => <span className="legend-item" key={label}><span className="legend-dot" style={{ background: ['var(--primary-light)', 'var(--surface-alt)', '#254060', 'var(--danger-bg)'][index], border: '1px solid var(--border)' }} />{label}</span>)}</div>
    {!rooms.length && <div className="empty-state"><p>Nenhuma sala encontrada com os filtros atuais.</p></div>}
    {rooms.map(room => <section className="section" key={room.id}><div className="section-head"><h2>{room.name} <span className="text-muted">— {nameOf(data.units, room.unitId)}</span></h2></div><div className="agenda-wrap"><div className="agenda-grid"><div className="agenda-corner" />{WEEK_DAYS.map((day, index) => <div className="agenda-head" key={day}>{day}<br /><small>{displayDate(slotDate(Number(week), index))}</small></div>)}
      {HOURS.map(time => <Fragment key={time}><div className="agenda-time">{time}</div>{WEEK_DAYS.map((day, index) => {
        const date = slotDate(Number(week), index)
        const reservation = data.schedules.find(item => item.roomId === room.id && item.date === date && item.time === time)
        const reason = slotUnavailableReason(room, data.schedules, date, time)
        const status = reservation?.status || (room.status === 'manutencao' ? 'manutencao' : reason ? 'ocupado' : 'disponivel')
        const label = status === 'manutencao' ? 'Manutenção' : status === 'reservado' ? 'Reservado' : reservation ? 'Ocupado' : 'Encerrado'
        return <button type="button" key={day} className={`agenda-cell ${status}`} disabled={!!reason} title={reason || 'Reservar horário'} aria-label={`${reason || 'Horário disponível'} ${room.name} ${day} ${displayDate(date)} ${time}`} onClick={() => setSlot({ roomId: room.id, date, time })}>{reason && <span className="agenda-cell-label">{label}</span>}</button>
      })}</Fragment>)}
    </div></div></section>)}
    {slot && <ReserveDialog data={data} slot={slot} user={user} onClose={() => setSlot(null)} onSaved={() => { setSlot(null); if (user.role === 'user') setConfirmed(slot); refresh() }} />}
    {confirmed && <Modal title="Horário confirmado" onClose={() => setConfirmed(null)}><div className="modal-body"><p>Seu horário foi reservado. {link ? 'Você pode confirmar diretamente pelo WhatsApp com a unidade.' : 'O contato da unidade ainda não foi configurado.'}</p></div><div className="modal-foot"><button className="btn btn-secondary" onClick={() => setConfirmed(null)}>Concluir</button>{link && <a className="btn btn-primary" href={link} target="_blank" rel="noopener noreferrer">Falar pelo WhatsApp</a>}</div></Modal>}
  </>
}
function ReserveDialog({ data, slot, user, onClose, onSaved }: { data: Collections; slot: Slot; user: User; onClose(): void; onSaved(): void }) {
  const [professionalId, setProfessional] = useState(''), [value, setValue] = useState('0'), [shift, setShift] = useState('Manhã'), [note, setNote] = useState(''), [error, setError] = useState('')
  const admin = user.role === 'admin'
  const active = data.professionals.filter(item => item.status === 'ativo')
  const professional = active.find(item => item.roomId === slot.roomId) || active[0]
  return <Modal title={admin ? 'Alocar profissional' : 'Selecionar horário'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { reserveSlot({ ...slot, professionalId, value: Number(value), shift, note }); onSaved() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body">
    <p>{nameOf(data.rooms, slot.roomId)} · {displayDate(slot.date)} · {slot.time}</p>
    {admin ? <><Select label="Turno" value={shift} onChange={setShift}>{['Manhã', 'Tarde', 'Noite'].map(item => <option key={item}>{item}</option>)}</Select><Select label="Profissional" required value={professionalId} onChange={id => { setProfessional(id); setValue(String(active.find(item => item.id === id)?.value || 0)) }}><option value="">Selecione</option><Options items={active} /></Select><Field label="Valor (R$)" type="number" min="0" step="0.01" value={value} onChange={event => setValue(event.target.value)} /><Field label="Observação" value={note} onChange={event => setNote(event.target.value)} /></> : <p>Profissional: {professional?.name || 'A definir'} · Valor: {professional ? money(professional.value) : '—'}</p>}
    {error && <p role="alert">{error}</p>}
  </div><FormActions onClose={onClose} label={admin ? 'Confirmar alocação' : 'Confirmar horário'} /></form></Modal>
}
