import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Users, CheckCircle, Clock, TrendingUp, Activity, MapPin, Zap } from 'lucide-react'
import api from '../api/axios'

function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colors = {
    blue: 'text-accent bg-accent',
    green: 'text-success bg-success',
    yellow: 'text-warning bg-warning',
    red: 'text-danger bg-danger',
  }
  const [text, bg] = colors[color].split(' ')

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-accent hover:border-opacity-30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${bg} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${text}`} />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bg} bg-opacity-10 ${text}`}>Live</span>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-16 bg-subtle rounded animate-pulse" />
          <div className="h-4 w-24 bg-subtle rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-white mb-1">{value ?? 'â€”'}</p>
          <p className="text-sm font-medium text-slate-300">{title}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </>
      )}
    </div>
  )
}

function IncidentRow({ incident }) {
  const statusColors = {
    REPORTED: 'text-warning bg-warning',
    DISPATCHED: 'text-success bg-success',
    RESOLVED: 'text-accent bg-accent',
    CANCELLED: 'text-muted bg-muted',
  }
  const typeColors = {
    FIRE: 'text-danger bg-danger',
    MEDICAL: 'text-accent bg-accent',
    POLICE: 'text-warning bg-warning',
    DISASTER: 'text-danger bg-danger',
  }
  const [sc, sb] = (statusColors[incident.status] || 'text-muted bg-muted').split(' ')
  const [tc, tb] = (typeColors[incident.type] || 'text-muted bg-muted').split(' ')

  return (
    <tr className="border-b border-border hover:bg-subtle transition-colors">
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-muted">{incident.id?.slice(0, 8)}...</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tb} bg-opacity-10 ${tc}`}>
          {incident.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted" />
          <span className="text-sm text-slate-300 capitalize">{incident.city}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1.5 h-3 rounded-sm ${i < incident.severity ? 'bg-danger' : 'bg-subtle'}`} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sb} bg-opacity-10 ${sc}`}>
          {incident.status}
        </span>
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const { data: healthEmergency } = useQuery({
    queryKey: ['health-emergency'],
    queryFn: () => api.get('/api/health').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: healthDispatch } = useQuery({
    queryKey: ['health-dispatch'],
    queryFn: () => api.get('/api/health/stats').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: incidents, isLoading: incLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: kafkaHealth } = useQuery({
    queryKey: ['kafka-health'],
    queryFn: () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 15000,
  })

  const total = healthEmergency?.totalIncidents ?? 0
  const dispatched = Array.isArray(incidents) ? incidents.filter(i => i.status === 'DISPATCHED').length : 0
  const reported = Array.isArray(incidents) ? incidents.filter(i => i.status === 'REPORTED').length : 0
  const totalResponders = healthDispatch?.totalResponders ?? 0
  const recentIncidents = Array.isArray(incidents) ? incidents.slice(0, 8) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">Real-time emergency operations overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Activity className="w-3.5 h-3.5 text-success" />
          <span>Auto-refreshes every 5s</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={total}
          subtitle="All time"
          icon={AlertTriangle}
          color="red"
          loading={incLoading}
        />
        <StatCard
          title="Dispatched"
          value={dispatched}
          subtitle="Currently active"
          icon={Zap}
          color="green"
          loading={incLoading}
        />
        <StatCard
          title="Pending"
          value={reported}
          subtitle="Awaiting dispatch"
          icon={Clock}
          color="yellow"
          loading={incLoading}
        />
        <StatCard
          title="Responders"
          value={totalResponders}
          subtitle="Across all cities"
          icon={Users}
          color="blue"
          loading={!healthDispatch}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">
        {/* City breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Responders by City</h3>
          <div className="space-y-3">
            {[
              { city: 'Mumbai', key: 'mumbai' },
              { city: 'Delhi', key: 'delhi' },
              { city: 'Bangalore', key: 'bangalore' },
            ].map(({ city, key }) => {
              const available = healthDispatch?.cities?.[key]?.available ?? 0
              const total = key === 'mumbai' ? 5 : 8
              const pct = Math.round((available / total) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{city}</span>
                    <span className="text-muted">{available}/{total} available</span>
                  </div>
                  <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kafka status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Kafka Pipeline</h3>
          <div className="space-y-3">
            {kafkaHealth?.consumerGroups?.map(g => (
              <div key={g.groupId} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-300 truncate max-w-32">{g.groupId}</p>
                  <p className="text-xs text-muted">Lag: {g.totalLag}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  g.status === 'HEALTHY'
                    ? 'bg-success bg-opacity-10 text-success'
                    : 'bg-danger bg-opacity-10 text-danger'
                }`}>{g.status}</span>
              </div>
            )) ?? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-8 bg-subtle rounded animate-pulse" />)}
              </div>
            )}
          </div>
        </div>

        {/* System status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Service Status</h3>
          <div className="space-y-3">
            {[
              { name: 'Emergency Service', port: 8082, status: healthEmergency?.status },
              { name: 'Dispatch Service', port: 8083, status: healthDispatch?.status },
              { name: 'Kafka Pipeline', port: null, status: kafkaHealth?.overallStatus === 'HEALTHY' ? 'UP' : 'DOWN' },
              { name: 'API Gateway', port: 8080, status: 'UP' },
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center justify-between">
                <p className="text-xs text-slate-300">{name}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${status === 'UP' || status === 'HEALTHY' ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                  <span className={`text-xs font-medium ${status === 'UP' || status === 'HEALTHY' ? 'text-success' : 'text-danger'}`}>
                    {status ?? 'Checking...'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
          <span className="text-xs text-muted">{recentIncidents.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {incLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-subtle rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentIncidents.length > 0 ? (
                recentIncidents.map(inc => <IncidentRow key={inc.id} incident={inc} />)
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">No incidents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}