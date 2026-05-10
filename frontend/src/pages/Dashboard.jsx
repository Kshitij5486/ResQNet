import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, Users, CheckCircle, Clock,
  Activity, Zap, MapPin, Shield, TrendingUp,
  Radio, Siren, ChevronRight, ArrowUpRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const SEVERITY_COLORS = {
  5: { bar: 'bg-red-500',    text: 'text-red-400',    label: 'CRITICAL' },
  4: { bar: 'bg-orange-500', text: 'text-orange-400', label: 'HIGH'     },
  3: { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'MEDIUM'   },
  2: { bar: 'bg-blue-400',   text: 'text-blue-400',   label: 'LOW'      },
  1: { bar: 'bg-slate-500',  text: 'text-slate-400',  label: 'MINIMAL'  },
}

const TYPE_STYLES = {
  FIRE:     { color: '#ef4444', bg: 'bg-red-500 bg-opacity-10',    text: 'text-red-400',    border: 'border-red-500'    },
  MEDICAL:  { color: '#3b82f6', bg: 'bg-blue-500 bg-opacity-10',   text: 'text-blue-400',   border: 'border-blue-500'   },
  POLICE:   { color: '#f59e0b', bg: 'bg-amber-500 bg-opacity-10',  text: 'text-amber-400',  border: 'border-amber-500'  },
  DISASTER: { color: '#8b5cf6', bg: 'bg-purple-500 bg-opacity-10', text: 'text-purple-400', border: 'border-purple-500' },
}

function OperationalBanner({ emergency, dispatch, kafka }) {
  const allUp = emergency?.status === 'UP' && dispatch?.status === 'UP'
  return (
    <div className={`rounded-xl border px-5 py-3 flex items-center justify-between mb-6 ${
      allUp
        ? 'bg-green-500 bg-opacity-5 border-green-500 border-opacity-20'
        : 'bg-red-500 bg-opacity-5 border-red-500 border-opacity-20'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${allUp ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className={`text-sm font-bold tracking-widest uppercase ${allUp ? 'text-green-400' : 'text-red-400'}`}>
          {allUp ? 'All Systems Operational' : 'System Degraded'}
        </span>
        <span className="text-slate-600 text-xs">|</span>
        <span className="text-slate-400 text-xs">Emergency Operations Center — ResQNet v1.0</span>
      </div>
      <div className="flex items-center gap-6">
        {[
          { label: 'Gateway',   up: true },
          { label: 'Emergency', up: emergency?.status === 'UP' },
          { label: 'Dispatch',  up: dispatch?.status === 'UP'  },
          { label: 'AI Engine', up: true },
          { label: 'Kafka',     up: kafka?.overallStatus === 'HEALTHY' },
        ].map(({ label, up }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${up ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle, icon: Icon, color, bg, border, loading, onClick, trend }) {
  return (
    <div onClick={onClick}
      className={`relative bg-card border rounded-xl p-5 transition-all duration-200 overflow-hidden ${border} border-opacity-20 ${onClick ? 'cursor-pointer hover:border-opacity-40 hover:-translate-y-0.5' : ''}`}>
      <div className={`absolute inset-0 ${bg} bg-opacity-30 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black bg-opacity-20">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color.replace('text-', 'bg-')}`} />
            <span className={`text-xs font-medium ${color}`}>LIVE</span>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-9 w-16 rounded bg-slate-700 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-700 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-4xl font-bold text-white tracking-tight">{value ?? '--'}</p>
              {trend && <span className="text-xs text-green-400 mb-1.5 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{trend}</span>}
            </div>
            <p className="text-sm font-semibold text-slate-300">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </>
        )}
        {onClick && (
          <div className={`absolute bottom-4 right-4 ${color} opacity-40 group-hover:opacity-70 transition-opacity`}>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  )
}

function IncidentRow({ inc, onClick }) {
  const ts = TYPE_STYLES[inc.type] || { color:'#64748b', bg:'bg-slate-500 bg-opacity-10', text:'text-slate-400', border:'border-slate-500' }
  const sv = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS[3]
  const isDispatch = inc.status === 'DISPATCHED'

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 hover:bg-opacity-50 transition-colors cursor-pointer group"
      onClick={() => onClick?.()}>
      <td className="px-4 py-3">
        <div className={`w-0.5 h-8 rounded-full ${ts.border} border-l-2 inline-block mr-3`} />
        <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors">{inc.id?.slice(0,8)}...</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${ts.bg} ${ts.text} ${ts.border} border-opacity-30`}>
          {inc.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span className="text-sm text-slate-300 capitalize">{inc.city}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-2 h-3.5 rounded-sm transition-all ${i < inc.severity ? sv.bar : 'bg-slate-700'}`} />
          ))}
          <span className={`text-xs font-bold ml-1.5 ${sv.text}`}>{sv.label}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isDispatch ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className={`text-xs font-bold ${isDispatch ? 'text-green-400' : 'text-yellow-400'}`}>{inc.status}</span>
        </div>
      </td>
    </tr>
  )
}

function CityBar({ city, available, total }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0
  const color = pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-slate-500" />
          <span className="text-xs font-semibold text-slate-300 capitalize">{city}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${pct > 60 ? 'text-green-400' : pct > 30 ? 'text-yellow-400' : 'text-red-400'}`}>{available}/{total}</span>
          <span className="text-xs text-slate-600">available</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: emergencyHealth, isLoading: emLoading } = useQuery({
    queryKey: ['health', 'emergency'],
    queryFn:  () => api.get('/api/health').then(r => r.data),
    refetchInterval: 10000,
  })
  const { data: dispatchHealth } = useQuery({
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

  const incList    = Array.isArray(incidents) ? incidents : []
  const total      = emergencyHealth?.totalIncidents ?? 0
  const dispatched = incList.filter(i => i.status === 'DISPATCHED').length
  const reported   = incList.filter(i => i.status === 'REPORTED').length
  const totalResp  = dispatchHealth?.totalResponders ?? 0
  const recent     = [...incList].sort((a,b) => (b.severity - a.severity)).slice(0, 8)
  const cities     = dispatchHealth?.cities ?? {}

  const cityStats = [
    { city:'Mumbai',    available: cities.mumbai?.available    ?? 0, total: 5 },
    { city:'Delhi',     available: cities.delhi?.available     ?? 0, total: 8 },
    { city:'Bangalore', available: cities.bangalore?.available ?? 0, total: 8 },
  ]

  return (
    <div className="space-y-5 min-h-screen">
      {/* Operational Banner */}
      <OperationalBanner emergency={emergencyHealth} dispatch={dispatchHealth} kafka={kafkaHealth} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time emergency command & control · Auto-syncs every 5s</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="w-3.5 h-3.5 text-green-400" />
          <span>Live · {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Incidents"  value={total}      subtitle="All time · all cities"    icon={Siren}         color="text-red-400"    bg="bg-red-500 bg-opacity-10"    border="border-red-500"    loading={emLoading}  onClick={() => navigate('/incidents')} />
        <MetricCard title="Dispatched"       value={dispatched}  subtitle="Currently active"         icon={Zap}           color="text-green-400"  bg="bg-green-500 bg-opacity-10"  border="border-green-500"  loading={incLoading} onClick={() => navigate('/incidents')} />
        <MetricCard title="Awaiting Dispatch" value={reported}   subtitle="Pending assignment"       icon={Clock}         color="text-yellow-400" bg="bg-yellow-500 bg-opacity-10" border="border-yellow-500" loading={incLoading} onClick={() => navigate('/incidents')} />
        <MetricCard title="Active Responders" value={totalResp}  subtitle="Across all 3 cities"      icon={Users}         color="text-blue-400"   bg="bg-blue-500 bg-opacity-10"   border="border-blue-500"   loading={!dispatchHealth} onClick={() => navigate('/responders')} />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Responder Availability */}
        <div className="bg-card border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Unit Availability</h3>
              <p className="text-xs text-slate-500 mt-0.5">Responders by city</p>
            </div>
            <button onClick={() => navigate('/responders')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            {cityStats.map(c => <CityBar key={c.city} {...c} />)}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total available</span>
            <span className="text-sm font-bold text-white">{cityStats.reduce((s,c) => s+c.available, 0)} / {cityStats.reduce((s,c) => s+c.total, 0)}</span>
          </div>
        </div>

        {/* Kafka Pipeline */}
        <div className="bg-card border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kafka Pipeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Consumer group health</p>
            </div>
            <button onClick={() => navigate('/monitoring')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              Monitor <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {!kafkaHealth ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-16 rounded-lg bg-slate-800 animate-pulse"/>)}</div>
          ) : (
            <div className="space-y-3">
              {kafkaHealth.consumerGroups?.map(g => {
                const healthy = g.status === 'HEALTHY'
                return (
                  <div key={g.groupId} className={`rounded-lg border p-3.5 ${healthy ? 'border-green-500 border-opacity-20 bg-green-500 bg-opacity-5' : 'border-red-500 border-opacity-20 bg-red-500 bg-opacity-5'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${healthy ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        <p className="text-xs font-semibold text-white">
                          {g.groupId === 'dispatch-service-group' ? 'Dispatch Consumer' : 'DLT Consumer'}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${healthy ? 'text-green-400' : 'text-red-400'}`}>{g.status}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Lag: <span className={`font-bold ${healthy ? 'text-green-400' : 'text-red-400'}`}>{g.totalLag}</span></span>
                      <span>Partitions: <span className="text-white font-medium">{g.partitions?.length ?? 0}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Pipeline status</span>
            <span className={`text-xs font-bold ${kafkaHealth?.overallStatus === 'HEALTHY' ? 'text-green-400' : 'text-red-400'}`}>
              {kafkaHealth?.overallStatus ?? 'Checking...'}
            </span>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-card border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Service Health</h3>
              <p className="text-xs text-slate-500 mt-0.5">Microservice status</p>
            </div>
            <button onClick={() => navigate('/health')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              { name:'API Gateway',       port:'8080', status:'UP',  icon:Shield  },
              { name:'Emergency Service', port:'8082', status:emergencyHealth?.status, icon:Siren },
              { name:'Dispatch Service',  port:'8083', status:dispatchHealth?.status,  icon:Zap   },
              { name:'AI Service',        port:'8084', status:'UP',  icon:Activity },
            ].map(({ name, port, status, icon: Icon }) => {
              const up = status === 'UP'
              return (
                <div key={name} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${up ? 'text-green-400' : 'text-red-400'}`} />
                    <div>
                      <p className="text-xs font-medium text-slate-300">{name}</p>
                      <p className="text-xs text-slate-600">:{port}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${up ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-xs font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>{status ?? '...'}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Active services</span>
            <span className="text-sm font-bold text-green-400">4 / 4</span>
          </div>
        </div>
      </div>

      {/* Incident Priority Queue */}
      <div className="bg-card border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 bg-opacity-50">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Incident Priority Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by severity · Click row to view all</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Auto-refresh 5s
            </div>
            <button onClick={() => navigate('/incidents')}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 bg-opacity-30">
                {['Incident ID', 'Type', 'Location', 'Severity', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : recent.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-600 text-sm">No incidents — system standing by</td></tr>
              ) : (
                recent.map(inc => <IncidentRow key={inc.id} inc={inc} onClick={() => navigate('/incidents')} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}