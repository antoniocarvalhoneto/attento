export function StatCard({ icon, label, value, warning = false }: { icon: string; label: string; value: string | number; warning?: boolean }) {
  const color = warning ? 'amber' : 'neutral'
  return <div className={`stat-card stat-card-${color}`}>
    <div className={`stat-icon ${color}`}><i className={`fa-solid ${icon}`} aria-hidden="true" /></div>
    <div className="stat-info"><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>
  </div>
}
