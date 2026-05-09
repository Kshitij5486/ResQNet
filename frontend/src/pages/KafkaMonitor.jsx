import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Activity, CheckCircle, AlertTriangle, RefreshCw, Layers, Clock } from 'lucide-react'
import api from '../api/axios'

const TOPIC_DESCRIPTIONS = {
  'emergency-events':      { desc: 'SOS incidents published by Emergency Service', partitions: 6, color: '#ef4444' },
  'dispatch-updates':      { desc: 'Responder assignments from Dispatch Service',  partitions: 3, color: '#22c55e' },
  'notifications':         { desc: 'SMS and push notification events',             partitions: 3, color: '#f59e0b' },
  'emergency-events-dlt':  { desc: 'Dead letter queue for emergency events',       partitions: 3, color: '#6366f1' },
  'dispatch-updates-dlt':  { desc: 'Dead letter queue for dispatch updates',       partitions: 3, color: '#6366f1' },
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white mb-1">{label}</p>
      <p className="text-xs text-muted">Lag: <span className="text-accent font-bold">{payload[0]?.value}</span></p>
    </div>
  )
}

export default function KafkaMonitor() {
  const { data: lagData, isLoading: lagLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['kafka-lag'],
    queryFn: () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 8000,
  })

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['kafka-topics'],
    queryFn: () => api.get('/api/monitoring/kafka/topics').then(r => r.data),
    refetchInterval: 30000,
  })

  const overallStatus  = lagData?.overallStatus ?? 'CHECKING'
  const consumerGroups = lagData?.consumerGroups ?? []
  const topics         = topicsData?.topics ?? []
  const lastUpdate     = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  // Build chart data per group
  const chartData = consumerGroups.map(g => ({
    name: g.groupId === 'dispatch-service-group' ? 'Dispatch Service'
        : g.groupId === 'dispatch-dlt-group'     ? 'Dispatch DLT'
        : g.groupId,
    lag:    g.totalLag ?? 0,
    status: g.status,
  }))

  // Build partition lag chart
  const partitionData = consumerGroups.flatMap(g =>
    (g.partitions ?? []).map(p => ({
      name: p.topic.replace('emergency-events', 'emg').replace('dispatch-updates', 'dsp') + '-' + p.partition,
      lag:  p.lag,
      committed: p.committedOffset,
      end:  p.endOffset,
    }))
  )

  const totalMessages = consumerGroups.reduce((sum, g) =>
    sum + (g.partitions ?? []).reduce((s, p) => s + p.endOffset, 0), 0)

  const totalLag = consumerGroups.reduce((sum, g) => sum + (g.totalLag ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kafka Monitor</h1>
          <p className="text-muted text-sm mt-0.5">Real-time consumer lag and pipeline health · Last updated {lastUpdate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            overallStatus === 'HEALTHY'
              ? 'bg-success bg-opacity-10 border-success border-opacity-30 text-success'
              : overallStatus === 'CHECKING'
              ? 'bg-muted bg-opacity-10 border-muted border-opacity-30 text-muted'
              : 'bg-danger bg-opacity-10 border-danger border-opacity-30 text-danger'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              overallStatus === 'HEALTHY' ? 'bg-success' : 'bg-danger'
            }`} />
            {overallStatus}
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white text-sm transition-all hover:border-accent hover:border-opacity-40">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Pipeline Status',
            value: overallStatus,
            icon: overallStatus === 'HEALTHY' ? CheckCircle : AlertTriangle,
            color: overallStatus === 'HEALTHY' ? 'text-success' : 'text-danger',
            bg:    overallStatus === 'HEALTHY' ? 'bg-success'   : 'bg-danger',
            sub:   'Overall health',
          },
          {
            label: 'Consumer Groups',
            value: consumerGroups.length,
            icon: Activity,
            color: 'text-accent',
            bg:    'bg-accent',
            sub:   'Active groups',
          },
          {
            label: 'Total Lag',
            value: totalLag,
            icon: Clock,
            color: totalLag === 0 ? 'text-success' : 'text-warning',
            bg:    totalLag === 0 ? 'bg-success'   : 'bg-warning',
            sub:   'Messages behind',
          },
          {
            label: 'Topics',
            value: topics.length,
            icon: Layers,
            color: 'text-accent',
            bg:    'bg-accent',
            sub:   'Kafka topics',
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${bg} bg-opacity-10 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color} mb-0.5`}>{lagLoading ? '--' : value}</p>
            <p className="text-sm font-medium text-slate-300">{label}</p>
            <p className="text-xs text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Consumer Group Lag Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Consumer Group Lag</h3>
          <p className="text-xs text-muted mb-4">Messages pending consumption per group</p>
          {lagLoading ? (
            <div className="h-48 bg-subtle rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e2d4520' }} />
                <Bar dataKey="lag" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.lag === 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Consumer Group Details */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Consumer Groups</h3>
          <p className="text-xs text-muted mb-4">Detailed status per consumer group</p>
          {lagLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-subtle rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {consumerGroups.map(g => {
                const isHealthy  = g.status === 'HEALTHY'
                const partitions = g.partitions ?? []
                const maxLag     = Math.max(...partitions.map(p => p.lag), 0)
                return (
                  <div key={g.groupId} className={`rounded-lg border p-3 ${
                    isHealthy ? 'border-success border-opacity-20 bg-success bg-opacity-5' : 'border-danger border-opacity-20 bg-danger bg-opacity-5'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-success' : 'bg-danger'} animate-pulse`} />
                        <p className="text-xs font-semibold text-white">{g.groupId}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isHealthy
                          ? 'bg-success bg-opacity-15 text-success'
                          : 'bg-danger bg-opacity-15 text-danger'
                      }`}>{g.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-muted">Total Lag</p>
                        <p className={`text-sm font-bold ${isHealthy ? 'text-success' : 'text-danger'}`}>{g.totalLag}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Partitions</p>
                        <p className="text-sm font-bold text-white">{partitions.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Max Lag</p>
                        <p className="text-sm font-bold text-white">{maxLag}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Partition Detail Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Partition Offsets</h3>
            <p className="text-xs text-muted mt-0.5">Per-partition committed vs end offsets</p>
          </div>
          <span className="text-xs text-muted">{partitionData.length} partitions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-subtle">
                {['Partition', 'Committed Offset', 'End Offset', 'Lag', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lagLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-4 bg-subtle rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : partitionData.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted text-sm">No partition data available</td></tr>
              ) : (
                partitionData.map((p, i) => (
                  <tr key={i} className="border-b border-border hover:bg-subtle transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-slate-300">{p.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-300">{p.committed}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-300">{p.end}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold ${p.lag === 0 ? 'text-success' : 'text-danger'}`}>{p.lag}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.lag === 0 ? 'bg-success' : 'bg-danger'}`} />
                        <span className={`text-xs font-medium ${p.lag === 0 ? 'text-success' : 'text-danger'}`}>
                          {p.lag === 0 ? 'Caught up' : 'Behind'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Kafka Topics</h3>
        <p className="text-xs text-muted mb-4">All topics in the ResQNet cluster</p>
        {topicsLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-subtle rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[...topics].sort().map(topic => {
              const meta = TOPIC_DESCRIPTIONS[topic]
              return (
                <div key={topic} className="border border-border rounded-lg p-3 hover:border-accent hover:border-opacity-30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ width:8, height:8, borderRadius:'50%', background: meta?.color ?? '#64748b', flexShrink:0 }} />
                    <p className="text-xs font-semibold text-white truncate">{topic}</p>
                  </div>
                  <p className="text-xs text-muted mb-2 leading-relaxed">{meta?.desc ?? 'Kafka topic'}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      <span className="text-muted">Partitions: </span>
                      <span className="font-semibold">{meta?.partitions ?? '?'}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}