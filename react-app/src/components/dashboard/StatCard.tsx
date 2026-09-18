export function StatCard({ label, value, warning = false }: { label: string; value: string | number; warning?: boolean }) {
  const color = warning ? 'amber' : 'neutral'
  return <dl className={`stat-card stat-card-${color}`}>
    <dt className="stat-label">{label}</dt>
    <dd className="stat-value">{value}</dd>
  </dl>
}
