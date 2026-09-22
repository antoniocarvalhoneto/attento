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
import { accountKind, accountTotals, downloadCSV, emptyFilters, filterAccounts, monthOptions } from '../services/finance'

const kindLabel = (item: Account) => accountKind(item) === 'payable' ? 'A pagar' : 'A receber'
export function FinancialPage() { return <Page>{(data, refresh) => <Financial data={data} refresh={refresh} />}</Page> }
function Financial({ data, refresh }: { data: Collections; refresh(): void }) {
  const [filters, setFilters] = useState(emptyFilters), [editing, setEditing] = useState<Account | null>(null), [removing, setRemoving] = useState<string | null>(null), [error, setError] = useState('')
  const list = filterAccounts(data.financial, filters), totals = accountTotals(list)
  function pay(id: string) { try { markPaid('financial', id); setError(''); refresh() } catch (failure) { setError((failure as Error).message) } }
  function exportReport() {
    try {
      downloadCSV([['Tipo', 'Unidade', 'Profissional', 'Descrição', 'Turnos / horas', 'Valor', 'Vencimento', 'Status', 'Pagamento'], ...list.map(item => [kindLabel(item), nameOf(data.units, item.unitId || null), nameOf(data.professionals, item.professionalId), item.description, item.rentalPeriod || '', item.value, item.dueDate, item.status, item.paymentDate || ''])])
      setError('')
    } catch { setError('Não foi possível exportar o relatório. Tente novamente.') }
  }
  return <>
    <PageHead title="Contas / Financeiro" description="Recebimentos, despesas por unidade e relatórios em um só lugar.">
      <button className="btn btn-secondary" onClick={exportReport}>Exportar CSV</button>
      <button className="btn btn-primary" onClick={() => setEditing({ id: '', kind: data.professionals.length ? 'receivable' : 'payable', unitId: '', rentalPeriod: '', professionalId: data.professionals[0]?.id || '', description: '', value: 0, dueDate: dateKey(), status: 'pendente', paymentDate: null })}>Nova conta</button>
    </PageHead>
    {error && <p role="alert">{error}</p>}
    <div className="filter-bar">
      <Select label="Tipo" value={filters.kind || 'all'} onChange={kind => setFilters({ ...filters, kind })}><option value="all">Todos</option><option value="receivable">A receber</option><option value="payable">A pagar</option></Select>
      <Select label="Unidade" value={filters.unit || 'all'} onChange={unit => setFilters({ ...filters, unit })}><option value="all">Todas</option><Options items={data.units} /></Select>
      <Select label="Profissional" value={filters.professional} onChange={professional => setFilters({ ...filters, professional })}><option value="all">Todos</option><Options items={data.professionals} /></Select>
      <Select label="Status" value={filters.status} onChange={status => setFilters({ ...filters, status })}><option value="all">Todos</option><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="vencido">Vencido</option></Select>
      <Select label="Mês de vencimento" value={filters.month} onChange={month => setFilters({ ...filters, month })}><option value="all">Todos</option>{monthOptions(data.financial).map(month => <option key={month.value} value={month.value}>{month.label}</option>)}</Select>
      <button className="btn btn-ghost btn-sm" onClick={() => setFilters(emptyFilters)}>Limpar</button>
    </div>
    <p className="text-muted">Totais e CSV seguem os filtros acima. O período considera o vencimento, inclusive para contas já pagas.</p>
    <div className="section stat-grid">
      <StatCard label="Recebido" value={money(totals.received)} /><StatCard label="Despesas pagas" value={money(totals.paid)} />
      <StatCard label="Saldo realizado" value={money(totals.balance)} />
      <StatCard label="A receber" value={money(totals.toReceive)} /><StatCard label="A pagar" value={money(totals.toPay)} warning={totals.toPay > 0} />
    </div>
    <DataTable empty={data.financial.length ? 'Nenhuma conta corresponde aos filtros. Altere a seleção ou use “Limpar”.' : 'Nenhuma conta cadastrada. Use “Nova conta” para registrar um recebimento ou uma despesa.'}
      headers={['Tipo', 'Unidade', 'Profissional', 'Descrição', 'Turnos / horas', 'Valor', 'Vencimento', 'Status', 'Pagamento', 'Ações']}
      rows={list.map(item => ({ id: item.id, cells: [kindLabel(item), nameOf(data.units, item.unitId || null), nameOf(data.professionals, item.professionalId), item.description, item.rentalPeriod || '—', money(item.value), displayDate(item.dueDate), <Status key="status" value={item.status} />, displayDate(item.paymentDate || ''), <RecordActions key="actions" onEdit={() => setEditing(item)} onDelete={() => setRemoving(item.id)} onPay={item.status !== 'pago' ? () => pay(item.id) : undefined} />] }))} />
    {editing && <AccountEditor record={editing} data={data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
    {removing && <DeleteDialog onClose={() => setRemoving(null)} onConfirm={() => { deleteRecord('financial', removing); setRemoving(null); refresh() }} />}
  </>
}
function AccountEditor({ record, data, onClose, onSaved }: { record: Account; data: Collections; onClose(): void; onSaved(): void }) {
  const [draft, setDraft] = useState(record), [error, setError] = useState('')
  const update = (values: Partial<Account>) => setDraft({ ...draft, ...values })
  const payable = accountKind(draft) === 'payable'
  return <Modal title={record.id ? 'Editar conta' : 'Nova conta'} onClose={onClose}>
    <form onSubmit={event => { event.preventDefault(); try { saveRecord('financial', { ...draft, description: draft.description.trim() }); onSaved() } catch (failure) { setError((failure as Error).message) } }}>
      <div className="modal-body">
        <Select label="Tipo" value={accountKind(draft)} onChange={kind => update({ kind: kind as Account['kind'], professionalId: kind === 'payable' ? '' : data.professionals[0]?.id || '', rentalPeriod: '' })}><option value="receivable">A receber</option><option value="payable">A pagar</option></Select>
        <Select label="Unidade" value={draft.unitId || ''} onChange={unitId => update({ unitId })}><option value="">Geral / não informada</option><Options items={data.units} /></Select>
        <Select label={payable ? 'Profissional (opcional)' : 'Profissional'} required={!payable} value={draft.professionalId} onChange={professionalId => update({ professionalId })}><option value="">Selecione</option><Options items={data.professionals} /></Select>
        <Field label="Descrição" required placeholder={payable ? 'Ex.: Energia, condomínio, internet' : 'Ex.: Aluguel de sala'} value={draft.description} onChange={event => update({ description: event.target.value })} />
        {!payable && <Field label="Turnos / horas contratados" placeholder="Ex.: Terças à tarde, sala Duna" value={draft.rentalPeriod || ''} onChange={event => update({ rentalPeriod: event.target.value })} />}
        <Field label="Valor (R$)" type="number" required min="0" step="0.01" value={draft.value} onChange={event => update({ value: Number(event.target.value) })} />
        <Field label="Vencimento" type="date" required value={draft.dueDate} onChange={event => update({ dueDate: event.target.value })} />
        <Select label="Status" value={draft.status} onChange={status => update({ status })}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="vencido">Vencido</option></Select>
        {error && <p role="alert">{error}</p>}
      </div><FormActions onClose={onClose} />
    </form>
  </Modal>
}