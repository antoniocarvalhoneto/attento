import { useState } from 'react'
import { Page } from '../components/Page'
import { Modal } from '../components/Modal'
import { DataTable, Field, FormActions, Options, PageHead, Select, Status } from '../components/Fields'
import { DeleteDialog, RecordActions } from '../components/RecordActions'
import { StatCard } from '../components/dashboard/StatCard'
import type { Account, Collections } from '../services/models'
import { money, nameOf } from '../services/models'
import { dateKey } from '../services/dates'
import { displayDate } from '../services/dashboard'
import { deleteRecord, markPaid, saveRecord } from '../services/repository'
import { downloadCSV, emptyFilters, filterAccounts, monthOptions } from '../services/finance'

export function FinancialPage({ reports = false }: { reports?: boolean }) { return <Page>{(data, refresh) => <Financial key={String(reports)} data={data} refresh={refresh} reports={reports} />}</Page> }
function Financial({ data, refresh, reports }: { data: Collections; refresh(): void; reports: boolean }) {
  const [filters, setFilters] = useState(emptyFilters), [editing, setEditing] = useState<Account | null>(null), [removing, setRemoving] = useState<string | null>(null), [error, setError] = useState('')
  const list = filterAccounts(data.financial, filters)
  function pay(id: string) { try { markPaid('financial', id); setError(''); refresh() } catch (failure) { setError((failure as Error).message) } }
  const total = (status?: string) => list.filter(item => !status || item.status === status).reduce((sum, item) => sum + Number(item.value), 0)
  function exportReport() { try { downloadCSV([['Profissional', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Pagamento'], ...list.map(item => [nameOf(data.professionals, item.professionalId), item.description, item.value, item.dueDate, item.status, item.paymentDate || ''])]); setError('') } catch { setError('Não foi possível exportar o relatório. Tente novamente.') } }
  return <><PageHead title={reports ? 'Relatórios Financeiros' : 'Contas / Financeiro'} description={reports ? 'Consolide os resultados financeiros por período e profissional.' : 'Acompanhe pagamentos e pendências dos profissionais.'}>{reports ? <button className="btn btn-primary" onClick={exportReport}>Exportar CSV</button> : <button className="btn btn-primary" disabled={!data.professionals.length} onClick={() => setEditing({ id: '', professionalId: data.professionals[0]?.id || '', description: '', value: 0, dueDate: dateKey(), status: 'pendente', paymentDate: null })}>Nova conta</button>}</PageHead>
    {!reports && !data.professionals.length && <p>Cadastre um profissional antes de adicionar uma conta.</p>}{error && <p role="alert">{error}</p>}
    <div className="filter-bar"><Select label="Profissional" value={filters.professional} onChange={professional => setFilters({ ...filters, professional })}><option value="all">Todos</option><Options items={data.professionals} /></Select><Select label="Status" value={filters.status} onChange={status => setFilters({ ...filters, status })}><option value="all">Todos</option><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="vencido">Vencido</option></Select><Select label="Mês de vencimento" value={filters.month} onChange={month => setFilters({ ...filters, month })}><option value="all">Todos</option>{monthOptions(data.financial).map(month => <option key={month.value} value={month.value}>{month.label}</option>)}</Select><button className="btn btn-ghost btn-sm" onClick={() => setFilters(emptyFilters)}>Limpar</button></div>
    <div className="section stat-grid"><StatCard icon="fa-wallet" label="Total geral" value={money(total())} /><StatCard icon="fa-circle-check" label="Total recebido" value={money(total('pago'))} /><StatCard icon="fa-hourglass-half" label="Total pendente" value={money(total('pendente'))} warning={total('pendente') > 0} /><StatCard icon="fa-triangle-exclamation" label="Total vencido" value={money(total('vencido'))} warning={total('vencido') > 0} /></div>
    <DataTable headers={['Profissional', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Pagamento', ...(!reports ? ['Ações'] : [])]} rows={list.map(item => ({ id: item.id, cells: [nameOf(data.professionals, item.professionalId), item.description, money(item.value), displayDate(item.dueDate), <Status key="status" value={item.status} />, displayDate(item.paymentDate || ''), ...(!reports ? [<RecordActions key="actions" onEdit={() => setEditing(item)} onDelete={() => setRemoving(item.id)} onPay={item.status !== 'pago' ? () => pay(item.id) : undefined} />] : [])] }))} />
    {editing && <AccountEditor record={editing} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    {removing && <DeleteDialog onClose={() => setRemoving(null)} onConfirm={() => { deleteRecord('financial', removing); setRemoving(null); refresh() }} />}
  </>
}
function AccountEditor({ record, data, onClose, onSaved }: { record: Account; data: Collections; onClose(): void; onSaved(): void }) {
  const [draft, setDraft] = useState(record), [error, setError] = useState('')
  const update = (values: Partial<Account>) => setDraft({ ...draft, ...values })
  return <Modal title={record.id ? 'Editar conta' : 'Nova conta'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { saveRecord('financial', { ...draft, description: draft.description.trim() }); onSaved() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body"><Select label="Profissional" required value={draft.professionalId} onChange={professionalId => update({ professionalId })}><Options items={data.professionals} /></Select><Field label="Descrição" required value={draft.description} onChange={event => update({ description: event.target.value })} /><Field label="Valor (R$)" type="number" required min="0" step="0.01" value={draft.value} onChange={event => update({ value: Number(event.target.value) })} /><Field label="Vencimento" type="date" required value={draft.dueDate} onChange={event => update({ dueDate: event.target.value })} /><Select label="Status" value={draft.status} onChange={status => update({ status })}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="vencido">Vencido</option></Select>{error && <p role="alert">{error}</p>}</div><FormActions onClose={onClose} /></form></Modal>
}
