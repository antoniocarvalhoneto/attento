import { useState } from 'react'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { DataTable, Field, FormActions, Options, PageHead, Select, Status } from '../components/Fields'
import { DeleteDialog, RecordActions } from '../components/RecordActions'
import type { Collections, Insurance } from '../services/models'
import { INSURANCE_TYPES, money, nameOf } from '../services/models'
import { deleteRecord, markPaid, saveRecord } from '../services/repository'

export function InsurancePage() { return <Page>{(data, refresh) => <InsuranceList data={data} refresh={refresh} />}</Page> }
function InsuranceList({ data, refresh }: { data: Collections; refresh(): void }) {
  const [filter, setFilter] = useState('all'), [editing, setEditing] = useState<Insurance | null>(null), [removing, setRemoving] = useState<string | null>(null), [error, setError] = useState('')
  function pay(id: string) { try { markPaid('insurance', id); setError(''); refresh() } catch (failure) { setError((failure as Error).message) } }
  return <><PageHead title="Convênios" description="Controle os atendimentos por convênio e o repasse aos profissionais."><button className="btn btn-primary" disabled={!data.professionals.length} onClick={() => setEditing({ id: '', insuranceType: INSURANCE_TYPES[0], professionalId: data.professionals[0]?.id || '', quantity: 1, unitValue: 0, status: 'pendente' })}>Adicionar registro</button></PageHead>{!data.professionals.length && <p>Cadastre um profissional antes de adicionar um registro.</p>}{error && <p role="alert">{error}</p>}
    <div className="filter-bar"><Select label="Tipo de convênio" value={filter} onChange={setFilter}><option value="all">Todos</option>{INSURANCE_TYPES.map(type => <option key={type}>{type}</option>)}</Select><button className="btn btn-ghost btn-sm" onClick={() => setFilter('all')}>Limpar</button></div>
    <DataTable headers={['Convênio', 'Profissional', 'Quantidade', 'Valor unitário', 'Valor total', 'Status', 'Ações']} rows={data.insurance.filter(item => filter === 'all' || item.insuranceType === filter).map(item => ({ id: item.id, cells: [item.insuranceType, nameOf(data.professionals, item.professionalId), item.quantity, money(item.unitValue), money(item.quantity * item.unitValue), <Status key="status" value={item.status} />, <RecordActions key="actions" onEdit={() => setEditing(item)} onDelete={() => setRemoving(item.id)} onPay={item.status !== 'pago' ? () => pay(item.id) : undefined} />] }))} />
    {editing && <InsuranceEditor record={editing} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    {removing && <DeleteDialog onClose={() => setRemoving(null)} onConfirm={() => { deleteRecord('insurance', removing); setRemoving(null); refresh() }} />}
  </>
}
function InsuranceEditor({ record, data, onClose, onSaved }: { record: Insurance; data: Collections; onClose(): void; onSaved(): void }) {
  const [draft, setDraft] = useState(record), [error, setError] = useState('')
  const update = (values: Partial<Insurance>) => setDraft({ ...draft, ...values })
  return <Modal title={record.id ? 'Editar registro' : 'Novo registro de convênio'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { saveRecord('insurance', draft); onSaved() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body"><Select label="Convênio" value={draft.insuranceType} onChange={insuranceType => update({ insuranceType })}>{INSURANCE_TYPES.map(type => <option key={type}>{type}</option>)}</Select><Select label="Profissional" value={draft.professionalId} required onChange={professionalId => update({ professionalId })}><Options items={data.professionals} /></Select><Field label="Quantidade" type="number" min="1" step="1" required value={draft.quantity} onChange={event => update({ quantity: Number(event.target.value) })} /><Field label="Valor unitário (R$)" type="number" min="0" step="0.01" required value={draft.unitValue} onChange={event => update({ unitValue: Number(event.target.value) })} /><p>Total calculado: <strong>{money(draft.quantity * draft.unitValue)}</strong></p><Select label="Status" value={draft.status} onChange={status => update({ status })}><option value="pendente">Pendente</option><option value="pago">Pago</option></Select>{error && <p role="alert">{error}</p>}</div><FormActions onClose={onClose} /></form></Modal>
}
