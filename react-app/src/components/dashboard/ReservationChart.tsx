import { WEEK_DAYS } from '../../services/dashboard'
import type { DashboardModel } from '../../services/dashboard'

export function ReservationChart({ model }: { model: Extract<DashboardModel, { role: 'admin' }> }) {
  const { weekCounts, weekTotal, chartStep, chartMax, todayIndex } = model
  return <section className="dashboard-analysis">
    <div className="reservation-chart-head"><h2>Reservas por dia</h2><span className="reservation-chart-total">{weekTotal} {weekTotal === 1 ? 'reserva' : 'reservas'}</span></div>
    <p className="text-muted mt-8">Semana atual · Todas as unidades</p>
    <div className="reservation-chart" role="img" aria-label={`Reservas por dia, semana atual. ${weekCounts.map((count, i) => `${WEEK_DAYS[i]}: ${count} ${count === 1 ? 'reserva' : 'reservas'}`).join('; ')}`}>
      <div className="chart-axis" aria-hidden="true">{[4, 3, 2, 1, 0].map(tick => <span key={tick}>{tick * chartStep}</span>)}</div>
      <div className="chart-plot" aria-hidden="true">{weekCounts.map((count, i) => <div key={WEEK_DAYS[i]} className={`chart-column${i === todayIndex ? ' is-today' : ''}`}>
        <div className="chart-bar" style={{ height: `${count / chartMax * 100}%` }}><span className="chart-value">{count}</span></div>
        <span className="chart-day">{WEEK_DAYS[i]}{i === todayIndex && <small>Hoje</small>}</span>
      </div>)}</div>
    </div>
    {weekTotal === 0 && <p className="text-muted mt-8">Nenhuma reserva nesta semana.</p>}
  </section>
}
