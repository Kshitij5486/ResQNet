import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Brain, Zap, AlertTriangle, CheckCircle, RefreshCw,
  Activity, Clock, MapPin, TrendingUp, Play, Filter, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const TYPE_CONFIG = {
  FIRE:     { color: '#ef4444', bg: 'bg-danger',  label: 'Fire'     },
  MEDICAL:  { color: '#3b82f6', bg: 'bg-accent',  label: 'Medical'  },
  POLICE:   { color: '#f59e0b', bg: 'bg-warning', label: 'Police'   },
  DISASTER: { color: '#8b5cf6', bg: 'bg-purple',  label: 'Disaster' },
}

const RISK_CONFIG = {
  LOW:      { color: 'text-success', bg: 'bg-success', border: 'border-success' },
  MEDIUM:   { color: 'text-warning', bg: 'bg-warning', border: 'border-warning' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500' },
  CRITICAL: { color: 'text-danger',  bg: 'bg-danger',  border: 'border-danger'  },
}

function EventCard({ event }) {
  const pred    = event.ai_prediction || {}
  const type    = TYPE_CONFIG[event.type]   || { color: '#64748b', bg: 'bg-muted', label: event.type }
  const risk    = RISK_CONFIG[pred.risk_level] || RISK_CONFIG.MEDIUM
  const isLive  = !event.simulated

  return (
    <div className={`bg-card border rounded-xl p-4 transition-all hover:border-opacity-50 ${
      pred.risk_level === 'CRITICAL' ? 'border-danger border-opacity-30' :
      pred.risk_level === 'HIGH'     ? 'border-orange-500 border-opacity-20' :
      'border-border'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div style={{ background: type.color + '18', border: `1px solid ${type.color}33` }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle style={{ color: type.color }} className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white text-sm font-semibold">{type.label} Incident</p>
              {isLive && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success bg-opacity-10 border border-success border-opacity-20">
                  <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
                  <span className="text-success text-xs">Live</span>
                </div>
              )}
              {event.simulated && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent bg-opacity-10 text-accent border border-accent border-opacity-20">Simulated</span>
              )}
            </div>
            <p className="text-muted text-xs font-mono mt-0.5">{event.incident_id?.slice(0,16)}...</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold ${risk.color} ${risk.bg} bg-opacity-10 ${risk.border} border-opacity-30`}>
          {pred.risk_level === 'CRITICAL' && <Zap className="w-3 h-3" />}
          {pred.risk_level === 'HIGH'     && <AlertTriangle className="w-3 h-3" />}
          {pred.risk_level === 'MEDIUM'   && <Activity className="w-3 h-3" />}
          {pred.risk_level === 'LOW'      && <CheckCircle className="w-3 h-3" />}
          {pred.risk_level || 'MEDIUM'}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-subtle rounded-lg px-3 py-2">
          <p className="text-xs text-muted">City</p>
          <p className="text-xs font-semibold text-white capitalize flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted" />{event.city}
          </p>
        </div>
        <div className="bg-subtle rounded-lg px-3 py-2">
          <p className="text-xs text-muted">Reported Severity</p>
          <div className="flex items-center gap-0.5 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1.5 h-3 rounded-sm ${i < event.severity ? 'bg-danger' : 'bg-border'}`} />
            ))}
            <span className="text-xs text-muted ml-1">{event.severity}/5</span>
          </div>
        </div>
      </div>

      {/* AI Prediction */}
      <div className="bg-subtle rounded-xl p-3 border border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-accent">AI Prediction</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <p className="text-xs text-muted">Predicted Severity</p>
            <p className={`text-lg font-bold ${risk.color}`}>{pred.predicted_severity ?? '--'}<span className="text-xs text-muted">/5</span></p>
          </div>
          <div>
            <p className="text-xs text-muted">Confidence</p>
            <p className="text-sm font-bold text-white">{pred.confidence ? (pred.confidence*100).toFixed(1)+'%' : '--'}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Risk Level</p>
            <p className={`text-sm font-bold ${risk.color}`}>{pred.risk_level ?? '--'}</p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">{pred.reasoning}</p>
        {pred.factors && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(pred.factors).map(([k, v]) =>
              typeof v === 'boolean' && v ? (
                <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-accent bg-opacity-10 text-accent">
                  {k.replace(/_/g,' ')}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted">
          <Clock className="w-3 h-3" />
          <span>{new Date(event.processed_at).toLocaleTimeString()}</span>
        </div>
        {event.kafka_offset >= 0 && (
          <span className="text-xs text-muted">Kafka offset: {event.kafka_offset}</span>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-','text-')}`} />
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse`} />
      </div>
      <p className={`text-2xl font-bold ${color.replace('bg-','text-')} mb-0.5`}>{value ?? '--'}</p>
      <p className="text-xs font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AIEvents() {
  const [filterType, setFilterType] = useState('')
  const [filterRisk, setFilterRisk] = useState('')

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['ai-events-status'],
    queryFn:  () => api.get('/api/ai/events/status').then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: eventsData, isLoading: eventsLoading, refetch } = useQuery({
    queryKey: ['ai-events-recent'],
    queryFn:  () => api.get('/api/ai/events/recent?n=20').then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: statsData } = useQuery({
    queryKey: ['ai-events-stats'],
    queryFn:  () => api.get('/api/ai/events/stats').then(r => r.data),
    refetchInterval: 5000,
  })

  const simulateMutation = useMutation({
    mutationFn: ({ type, city, severity }) =>
      api.post(`/api/ai/events/simulate?incident_type=${type}&city=${city}&severity=${severity}`).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`AI processed: ${data.event.type} in ${data.event.city} → ${data.ai_result.risk_level}`)
      refetch()
    },
    onError: () => toast.error('Simulation failed'),
  })

  const events  = eventsData?.events ?? []
  const stats   = statsData ?? {}
  const consumer = statusData?.kafka_consumer ?? {}

  const filtered = events.filter(e => {
    if (filterType && e.type !== filterType) return false
    if (filterRisk && e.ai_prediction?.risk_level !== filterRisk) return false
    return true
  })

  const scenarios = [
    { type:'FIRE',     city:'mumbai',    severity:5, label:'🔥 Fire Mumbai',         color:'bg-danger'  },
    { type:'MEDICAL',  city:'delhi',     severity:3, label:'🏥 Medical Delhi',        color:'bg-accent'  },
    { type:'DISASTER', city:'bangalore', severity:5, label:'⚡ Disaster Bangalore',   color:'bg-purple-500' },
    { type:'POLICE',   city:'mumbai',    severity:2, label:'👮 Police Mumbai',        color:'bg-warning' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            AI Event Feed
          </h1>
          <p className="text-muted text-sm mt-0.5">
            Real-time AI predictions on emergency events · Kafka consumer + Python ML
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            consumer.connected
              ? 'bg-success bg-opacity-10 border-success border-opacity-30 text-success'
              : 'bg-warning bg-opacity-10 border-warning border-opacity-30 text-warning'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${consumer.connected ? 'bg-success' : 'bg-warning'}`} />
            Kafka: {consumer.mode === 'kafka' ? 'Connected' : 'Standalone'}
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white text-sm transition-all">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Events Processed" value={stats.total_events_processed}   color="bg-accent"   icon={Activity}      sub="All time" />
        <StatCard label="Avg AI Severity"   value={stats.avg_predicted_severity}   color="bg-warning"  icon={TrendingUp}    sub="Predicted by ML" />
        <StatCard label="High Severity"     value={stats.high_severity_count}      color="bg-danger"   icon={AlertTriangle} sub="Severity 4-5" />
        <StatCard label="Messages Consumed" value={consumer.messages_consumed}     color="bg-success"  icon={Zap}           sub="From Kafka" />
      </div>

      {/* City + Type breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Events by City</h3>
          <div className="space-y-2">
            {Object.entries(stats.events_per_city ?? {}).map(([city, count]) => {
              const total = Object.values(stats.events_per_city ?? {}).reduce((a,b) => a+b, 0)
              const pct   = total > 0 ? Math.round((count/total)*100) : 0
              return (
                <div key={city}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 capitalize">{city}</span>
                    <span className="text-muted">{count} events ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: pct+'%' }} />
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.events_per_city ?? {}).length === 0 && (
              <p className="text-muted text-xs">No events yet — simulate some below</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Events by Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.events_per_type ?? {}).map(([type, count]) => {
              const total = Object.values(stats.events_per_type ?? {}).reduce((a,b) => a+b, 0)
              const pct   = total > 0 ? Math.round((count/total)*100) : 0
              const tc    = TYPE_CONFIG[type] || { color:'#64748b' }
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{type}</span>
                    <span className="text-muted">{count} events ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: pct+'%', background: tc.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Simulate buttons */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-white">Simulate Events</h3>
          <span className="text-xs text-muted ml-1">— test AI pipeline without Kafka</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(s => (
            <button key={s.label}
              onClick={() => simulateMutation.mutate(s)}
              disabled={simulateMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-60 hover:opacity-90 ${s.color} bg-opacity-80`}>
              {simulateMutation.isPending
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Play className="w-3 h-3" />
              }
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            Recent AI-Processed Events
            <span className="text-muted font-normal ml-1">({filtered.length} shown)</span>
          </h3>
          <div className="flex items-center gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-accent">
              <option value="">All Types</option>
              {['FIRE','MEDICAL','POLICE','DISASTER'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-accent">
              <option value="">All Risk</option>
              {['LOW','MEDIUM','HIGH','CRITICAL'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(filterType || filterRisk) && (
              <button onClick={() => { setFilterType(''); setFilterRisk('') }}
                className="text-danger hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Brain className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No events yet</p>
            <p className="text-muted text-sm">Click a simulate button above to generate AI-processed events</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[...filtered].reverse().map((event, i) => (
              <EventCard key={`${event.incident_id}-${i}`} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}