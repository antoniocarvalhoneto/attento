import { useState } from 'react'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { DataTable, Field, FormActions, Options, PageHead, Select, Status } from '../components/Fields'
import { DeleteDialog, RecordActions } from '../components/RecordActions'
import type { Collections, Professional, Room } from '../services/models'
import { money, nameOf } from '../services/models'
import { deleteRecord, saveRecord } from '../services/repository'

type Kind = 'rooms' | 'professionals'
type Record = Room | Professional
export function CatalogPage({ kind }: { kind: Kind }) { return <Page>{(data, refresh) => <Catalog key={kind} kind={kind} data={data} refresh={refresh} />}</Page> }
function Catalog({ kind, data, refresh }: { kind: Kind; data: Collections; refresh(): void }) {
  const [editing, setEditing] = useState<Record | null>(null), [viewing, setViewing] = useState<Record | null>(null), [removing, setRemoving] = useState<string | null>(null)
  const rooms = kind === 'rooms'
  const label = rooms ? 'Nova sala' : 'Adicionar profissional'
  function create() { setEditing(rooms ? { id: '', name: '', unitId: data.units[0]?.id || '', capacity: 6, description: '', status: 'disponivel' } : { id: '', name: '', specialty: '', unitId: data.rooms[0]?.unitId || '', roomId: data.rooms[0]?.id || '', shift: 'Manhã', value: 0, status: 'ativo' }) }
  return <><PageHead title={rooms ? 'Salas' : 'Profissionais'} description={rooms ? 'Gerencie as salas de cada unidade.' : 'Cadastre e gerencie os profissionais das unidades.'}><button className="btn btn-primary" onClick={create} disabled={!data.units.length || (!rooms && !data.rooms.length)}>{label}</button></PageHead>
    {!rooms && !data.rooms.length && <p role="status">Cadastre uma sala antes de adicionar um profissional.</p>}
    <DataTable headers={rooms ? ['Sala', 'Unidade', 'Capacidade', 'Status', 'Ações'] : ['Nome', 'Especialidade', 'Unidade', 'Sala', 'Turno', 'Valor', 'Status', 'Ações']} rows={data[kind].map(item => ({ id: item.id, cells: [item.name, ...('capacity' in item ? [nameOf(data.units, item.unitId), item.capacity] : [item.specialty, nameOf(data.units, item.unitId), nameOf(data.rooms, item.roomId), item.shift, money(item.value)]), <Status key="status" value={item.status} />, <RecordActions key="actions" onView={() => setViewing(item)} onEdit={() => setEditing(item)} onDelete={() => setRemoving(item.id)} />] }))} />
    {editing && <CatalogEditor kind={kind} record={editing} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    {removing && <DeleteDialog onClose={() => setRemoving(null)} onConfirm={() => { deleteRecord(kind, removing); setRemoving(null); refresh() }} />}
    {viewing && <Modal title={viewing.name} onClose={() => setViewing(null)}><div className="modal-body"><div className="info-row"><span>Unidade</span><span>{nameOf(data.units, viewing.unitId)}</span></div>{'capacity' in viewing ? <><div className="info-row"><span>Capacidade</span><span>{viewing.capacity} pessoas</span></div><p>{viewing.description || 'Sem descrição.'}</p></> : <><p>Especialidade: {viewing.specialty || '—'}</p><p>Sala: {nameOf(data.rooms, viewing.roomId)}</p><p>Turno: {viewing.shift}</p><p>Valor: {money(viewing.value)}</p></>}<Status value={viewing.status} /></div></Modal>}
  </>
}
function CatalogEditor({ kind, record, data, onClose, onSaved }: { kind: Kind; record: Record; data: Collections; onClose(): void; onSaved(): void }) {
  const [draft, setDraft] = useState(record), [error, setError] = useState('')
  const update = (values: Partial<Room & Professional>) => setDraft({ ...draft, ...values })
  return <Modal title={record.id ? kind === 'rooms' ? 'Editar sala' : 'Editar profissional' : kind === 'rooms' ? 'Nova sala' : 'Adicionar profissional'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { if ('capacity' in draft) saveRecord('rooms', { ...draft, name: draft.name.trim() }); else saveRecord('professionals', { ...draft, name: draft.name.trim() }); onSaved() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body">
    <Field label={kind === 'rooms' ? 'Nome da sala' : 'Nome'} value={draft.name} required onChange={event => update({ name: event.target.value })} />
    <Select label="Unidade" value={draft.unitId} required onChange={unitId => update('roomId' in draft ? { unitId, roomId: data.rooms.find(room => room.unitId === unitId)?.id || '' } : { unitId })}><Options items={data.units} /></Select>
    {'capacity' in draft ? <><Field label="Descrição" value={draft.description} onChange={event => update({ description: event.target.value })} /><Field label="Capacidade" type="number" min="1" step="1" required value={draft.capacity} onChange={event => update({ capacity: Number(event.target.value) })} /><Select label="Status" value={draft.status} onChange={status => update({ status })}><option value="disponivel">Disponível</option><option value="manutencao">Manutenção</option><option value="inativa">Inativa</option></Select></> : <>
      <Field label="Especialidade" value={draft.specialty} onChange={event => update({ specialty: event.target.value })} /><Select label="Sala" value={draft.roomId} required onChange={roomId => update({ roomId })}><option value="">Selecione</option><Options items={data.rooms.filter(room => room.unitId === draft.unitId)} /></Select><Select label="Turno" value={draft.shift} onChange={shift => update({ shift })}>{['Manhã', 'Tarde', 'Noite'].map(shift => <option key={shift}>{shift}</option>)}</Select><Field label="Valor (R$)" type="number" min="0" step="0.01" required value={draft.value} onChange={event => update({ value: Number(event.target.value) })} /><Select label="Status" value={draft.status} onChange={status => update({ status })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select>
    </>}{error && <p role="alert">{error}</p>}
  </div><FormActions onClose={onClose} /></form></Modal>
}
