import { useState } from 'react'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { DataTable, Field, FormActions, Options, PageHead, Select, Status } from '../components/Fields'
import { DeleteDialog, RecordActions } from '../components/RecordActions'
import type { Collections, Convenience } from '../services/models'
import { CONVENIENCE_PRODUCTS, money, nameOf } from '../services/models'
import { dateKey } from '../services/dates'
import { displayDate } from '../services/dashboard'
import { deleteRecord, markPaid, saveRecord } from '../services/repository'

export function ConveniencesPage() { return <Page>{(data, refresh) => <ConveniencesList data={data} refresh={refresh} />}</Page> }
function ConveniencesList({ data, refresh }: { data: Collections; refresh(): void }) {
  const [filter, setFilter] = useState('all'), [editing, setEditing] = useState<Convenience | null>(null), [removing, setRemoving] = useState<string | null>(null), [error, setError] = useState('')
  function pay(id: string) { try { markPaid('conveniences', id); setError(''); refresh() } catch (failure) { setError((failure as Error).message) } }
  return <><PageHead title="Conveniências" description="Registre o consumo de café, alimentos e impressões por profissional."><button className="btn btn-primary" disabled={!data.professionals.length} onClick={() => setEditing({ id: '', productId: CONVENIENCE_PRODUCTS[0].id, professionalId: data.professionals[0]?.id || '', quantity: 1, unitValue: CONVENIENCE_PRODUCTS[0].price, date: dateKey(), status: 'pendente' })}>Registrar consumo</button></PageHead>{!data.professionals.length && <p>Cadastre um profissional antes de registrar consumo.</p>}{error && <p role="alert">{error}</p>}
    <div className="filter-bar"><Select label="Conveniência" value={filter} onChange={setFilter}><option value="all">Todas</option><Options items={CONVENIENCE_PRODUCTS} /></Select><button className="btn btn-ghost btn-sm" onClick={() => setFilter('all')}>Limpar</button></div>
    <DataTable empty="Nenhum consumo encontrado. Use Registrar consumo para começar ou altere o filtro." headers={['Conveniência', 'Profissional', 'Data', 'Quantidade', 'Valor unitário', 'Total', 'Status', 'Ações']} rows={data.conveniences.filter(item => filter === 'all' || item.productId === filter).map(item => ({ id: item.id, cells: [nameOf(CONVENIENCE_PRODUCTS, item.productId), nameOf(data.professionals, item.professionalId), displayDate(item.date), item.quantity, money(item.unitValue), money(item.quantity * item.unitValue), <Status key="status" value={item.status} />, <RecordActions key="actions" onEdit={() => setEditing(item)} onDelete={() => setRemoving(item.id)} onPay={item.status !== 'pago' ? () => pay(item.id) : undefined} />] }))} />
    {editing && <ConvenienceEditor record={editing} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    {removing && <DeleteDialog onClose={() => setRemoving(null)} onConfirm={() => { deleteRecord('conveniences', removing); setRemoving(null); refresh() }} />}
  </>
}
function ConvenienceEditor({ record, data, onClose, onSaved }: { record: Convenience; data: Collections; onClose(): void; onSaved(): void }) {
  const [draft, setDraft] = useState(record), [error, setError] = useState('')
  const update = (values: Partial<Convenience>) => setDraft({ ...draft, ...values })
  return <Modal title={record.id ? 'Editar consumo' : 'Registrar consumo'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { saveRecord('conveniences', draft); onSaved() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body">
    <Select label="Conveniência" value={draft.productId} onChange={productId => update({ productId, unitValue: CONVENIENCE_PRODUCTS.find(item => item.id === productId)!.price })}><Options items={CONVENIENCE_PRODUCTS} /></Select>
    <Select label="Profissional" value={draft.professionalId} required onChange={professionalId => update({ professionalId })}><Options items={data.professionals} /></Select>
    <Field label="Data do consumo" type="date" required value={draft.date} onChange={event => update({ date: event.target.value })} />
    <Field label="Quantidade" type="number" min="1" step="1" required value={draft.quantity} onChange={event => update({ quantity: Number(event.target.value) })} />
    <Field label="Valor unitário (R$)" type="number" min="0" step="0.01" required value={draft.unitValue} onChange={event => update({ unitValue: Number(event.target.value) })} />
    <p>Total calculado: <strong>{money(draft.quantity * draft.unitValue)}</strong></p>
    <Select label="Status" value={draft.status} onChange={status => update({ status })}><option value="pendente">Pendente</option><option value="pago">Pago</option></Select>{error && <p role="alert">{error}</p>}
  </div><FormActions onClose={onClose} /></form></Modal>
}