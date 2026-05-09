import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, Users, CheckCircle, Clock,
  Activity, Zap, MapPin, Shield, TrendingUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function StatCard({ title, value, subtitle, icon: Icon, color, bg, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-opacity-50 card-hover' : ''}`}
      style={onClick ? {} : {}}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: bg + '18', border: `1px solid ${bg}30` }}>
          <Icon className="w-5 h-5" style={{ color: bg }} />
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: bg + '15' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: bg }} />
          <span className="text-xs font-medium" style={{ color: bg }}>Live</span>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-16 rounded shimmer" />
          <div className="h-4 w-28 rounded shimmer" />
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-white mb-1 stat-number">{value ?? '--'}</p>
          <p className="text-sm font-medium text-slate-300">{title}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </>
      )}
    </div>
  )
}

function IncidentRow({ inc }) {
  const navigate = useNavigate()
  const typeColors = {
    FIRE:     'text-danger bg-danger',
    MEDICAL:  'text-accent bg-accent',
    POLICE:   'text-warning bg-warning',
    DISASTER: 'text-danger bg-danger',
  }
  const statusColors = {
    REPORTED:   'text-warning bg-warning',
    DISPATCHED: 'text-success bg-success',
    RESOLVED:   'text-accent bg-accent',
  }
  const tc = typeColors[inc.type]   || 'text-muted bg-muted'
  const sc = statusColors[inc.status] || 'text-muted bg-muted'
  const [tt, tb] = tc.split(' ')
  const [st, sb] = sc.split(' ')

  return (
    <tr className="border-b border-border hover:bg-subtle transition-colors cursor-pointer group"
      onClick={() => navigate('/incidents')}>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-muted group-hover:text-slate-300 transition-colors">{inc.id?.slice(0,8)}...</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tb} bg-opacity-10 ${tt}`}>{inc.type}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted" />
          <span className="text-sm text-slate-300 capitalize">{inc.city}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-1.5 h-3 rounded-sm ${i < inc.severity ? 'bg-danger' : 'bg-subtle'}`} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${sb} ${inc.status === 'DISPATCHED' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sb} bg-opacity-10 ${st}`}>{inc.status}</span>
        </div>
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: healthEmergency, isLoading: emLoading } = useQuery({
    queryKey: ['health', 'emergency'],
    queryFn:  () => api.get('/api/health').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: healthDispatch } = useQuery({
    queryKey: ['health', 'dispatch'],
    queryFn:  () => api.get('/api/health/stats').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: incidents, isLoading: incLoading } = useQuery({
    queryKey: ['incidents-dashboard'],
    queryFn:  () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: kafkaHealth } = useQuery({
    queryKey: ['kafka-lag'],
    queryFn:  () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 8000,
  })

  const total      = healthEmergency?.totalIncidents ?? 0
  const incList    = Array.isArray(incidents) ? incidents : []
  const dispatched = incList.filter(i => i.status === 'DISPATCHED').length
  const reported   = incList.filter(i => i.status === 'REPORTED').length
  const totalResp  = healthDispatch?.totalResponders ?? 0
  const recent     = incList.slice(0, 8)

  const cities = healthDispatch?.cities ?? {}
  const cityStats = [
    { city: 'Mumbai',    available: cities.mumbai?.available    ?? 0, total: 5 },
    { city: 'Delhi',     available: cities.delhi?.available     ?? 0, total: 8 },
    { city: 'Bangalore', available: cities.bangalore?.available ?? 0, total: 8 },
  ]

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
        <StatCard title="Total Incidents"  value={total}      subtitle="All time"          icon={AlertTriangle} bg="#ef4444" loading={emLoading} onClick={() => navigate('/incidents')} />
        <StatCard title="Dispatched"       value={dispatched}  subtitle="Currently active"  icon={Zap}           bg="#22c55e" loading={incLoading} onClick={() => navigate('/incidents')} />
        <StatCard title="Pending"          value={reported}    subtitle="Awaiting dispatch"  icon={Clock}         bg="#f59e0b" loading={incLoading} onClick={() => navigate('/incidents')} />
        <StatCard title="Responders"       value={totalResp}   subtitle="Across all cities"  icon={Users}         bg="#3b82f6" loading={!healthDispatch} onClick={() => navigate('/responders')} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Responders by City */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Responders by City</h3>
            <button onClick={() => navigate('/responders')} className="text-xs text-accent hover:text-accent-hover transition-colors">View all</button>
          </div>
          <div className="space-y-4">
            {cityStats.map(({ city, available, total: tot }) => {
              const pct = tot > 0 ? Math.round((available / tot) * 100) : 0
              return (
                <div key={city}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{city}</span>
                    <span className="text-muted">{available}/{tot} available</span>
                  </div>
                  <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: pct + '%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kafka Pipeline */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Kafka Pipeline</h3>
            <button onClick={() => navigate('/monitoring')} className="text-xs text-accent hover:text-accent-hover transition-colors">Monitor</button>
          </div>
          {!kafkaHealth ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-14 rounded-lg shimmer" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {kafkaHealth.consumerGroups?.map(g => (
                <div key={g.groupId} className={`flex items-center justify-between p-3 rounded-lg border ${
                  g.status === 'HEALTHY'
                    ? 'bg-success bg-opacity-5 border-success border-opacity-15'
                    : 'bg-danger bg-opacity-5 border-danger border-opacity-15'
                }`}>
                  <div>
                    <p className="text-xs font-medium text-white">
                      {g.groupId === 'dispatch-service-group' ? 'dispatch-svc' : 'dispatch-dlt'}
                    </p>
                    <p className="text-xs text-muted">Lag: {g.totalLag}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${g.status === 'HEALTHY' ? 'bg-success' : 'bg-danger'}`} />
                    <span className={`text-xs font-semibold ${g.status === 'HEALTHY' ? 'text-success' : 'text-danger'}`}>{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Service Status</h3>
            <button onClick={() => navigate('/health')} className="text-xs text-accent hover:text-accent-hover transition-colors">Details</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Emergency Service', status: healthEmergency?.status },
              { name: 'Dispatch Service',  status: healthDispatch?.status  },
              { name: 'Kafka Pipeline',    status: kafkaHealth?.overallStatus === 'HEALTHY' ? 'UP' : 'DOWN' },
              { name: 'API Gateway',       status: 'UP' },
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center justify-between py-0.5">
                <p className="text-xs text-slate-300">{name}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${status === 'UP' ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                  <span className={`text-xs font-semibold ${status === 'UP' ? 'text-success' : 'text-danger'}`}>
                    {status ?? 'Checking...'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
            <p className="text-xs text-muted mt-0.5">Click any row to view all incidents</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{recent.length} shown</span>
            <button onClick={() => navigate('/incidents')}
              className="text-xs text-accent hover:text-accent-hover transition-colors font-medium">
              View all →
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-subtle">
                {['ID', 'Type', 'City', 'Severity', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded shimmer" /></td>
                    ))}
                  </tr>
                ))
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <TrendingUp className="w-8 h-8 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">No incidents yet</p>
                    <p className="text-xs text-muted mt-1">Create your first incident to get started</p>
                  </td>
                </tr>
              ) : (
                recent.map(inc => <IncidentRow key={inc.id} inc={inc} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}