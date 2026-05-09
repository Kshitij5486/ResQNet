export function LiveBadge({ label = 'Live', className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success bg-opacity-10 border border-success border-opacity-20 ${className}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      <span className="text-success text-xs font-medium">{label}</span>
    </div>
  )
}

export function PulsingDot({ color = 'success' }) {
  const colors = {
    success: 'bg-success',
    danger:  'bg-danger',
    warning: 'bg-warning',
    accent:  'bg-accent',
  }
  return <div className={`w-2 h-2 rounded-full ${colors[color] ?? colors.success} animate-pulse`} />
}

export function RefreshTimer({ interval = 5, lastUpdate }) {
  const time = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '--'
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      <span>Auto-refreshes every {interval}s · Last: {time}</span>
    </div>
  )
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-border">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-subtle rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-subtle rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-subtle rounded w-3/4 mb-2" />
          <div className="h-3 bg-subtle rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-subtle rounded" />
        <div className="h-3 bg-subtle rounded w-4/5" />
        <div className="h-3 bg-subtle rounded w-3/5" />
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-subtle flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted" />
      </div>
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      <p className="text-muted text-xs text-center max-w-48 leading-relaxed">{subtitle}</p>
      {action && (
        <button onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-lg bg-accent bg-opacity-10 border border-accent border-opacity-20 text-accent text-xs font-medium hover:bg-opacity-20 transition-all">
          {action.label}
        </button>
      )}
    </div>
  )
}

export function StatChange({ value, prev }) {
  if (prev === undefined || prev === null) return null
  const diff = value - prev
  if (diff === 0) return null
  return (
    <span className={`text-xs font-medium ml-1 ${diff > 0 ? 'text-success' : 'text-danger'}`}>
      {diff > 0 ? '+' : ''}{diff}
    </span>
  )
}