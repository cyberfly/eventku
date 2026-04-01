type MetricCardProps = {
  detail: string
  label: string
  value: string
}

export function MetricCard({ detail, label, value }: MetricCardProps) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}
