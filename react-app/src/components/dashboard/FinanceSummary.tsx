import type { DashboardModel } from '../../services/dashboard'

export function FinanceSummary({ finance }: { finance: Extract<DashboardModel, { role: 'admin' }>['finance'] }) {
  const items = [
    { label: 'Pago', count: finance.paid, color: 'var(--success)' },
    { label: 'Pendente', count: finance.pending, color: 'var(--warning)' },
    { label: 'Vencido', count: finance.overdue, color: 'var(--danger)' },
  ]
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return <div className="card">
    <h3>Situação financeira</h3><p className="text-muted mt-8">Distribuição das contas cadastradas</p>
    <div className="split-bar mt-16" aria-hidden="true">{items.map(item => <span key={item.label} style={{ width: `${item.count / (total || 1) * 100}%`, background: item.color }} />)}</div>
    <div className="legend-row">{items.map(item => <span className="legend-item" key={item.label}><span className="legend-dot" style={{ background: item.color }} aria-hidden="true" />{item.label} ({item.count})</span>)}</div>
    {!total && <p className="text-muted mt-8">Nenhuma conta cadastrada.</p>}
  </div>
}
