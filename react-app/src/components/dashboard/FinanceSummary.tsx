import type { DashboardModel } from '../../services/dashboard'

export function FinanceSummary({ finance }: { finance: Extract<DashboardModel, { role: 'admin' }>['finance'] }) {
  const items = [
    { label: 'Pagas', count: finance.paid, className: '' },
    { label: 'Pendentes', count: finance.pending, className: finance.pending ? 'is-pending' : '' },
    { label: 'Vencidas', count: finance.overdue, className: finance.overdue ? 'is-overdue' : '' },
  ]
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return <section className="dashboard-analysis">
    <h2>Contas a acompanhar</h2><p className="text-muted mt-8">Quantidade de contas por situação</p>
    <dl className="finance-summary">{items.map(item => <div key={item.label} className={item.className}><dt>{item.label}</dt><dd>{item.count}</dd></div>)}</dl>
    {!total && <p className="text-muted mt-8">Nenhuma conta cadastrada.</p>}
    <a className="summary-link" href="#financial">Ver financeiro</a>
  </section>
}
