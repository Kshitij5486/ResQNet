import { useQuery } from '@tanstack/react-query'
import {
  Activity, Zap, AlertTriangle, CheckCircle,
  RefreshCw, Radio, BarChart2, Database,
  Clock, ChevronRight, Layers, Server
} from 'lucide-react'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import api from '../api/axios'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white mb-1">{label}</p>
      {payload.map((p,i) => (
        <p key={i} className="text-xs" style={{color:p.color}}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function StatCard({ label, value, icon:Icon, color, sub, pulse }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
          <Icon className={`w-4.5 h-4.5 ${color.replace('bg-','text-')}`}/>
        </div>
        {pulse && <div className={`w-2 h-2 rounded-full ${color} animate-pulse`}/>}
      </div>
      <p className={`text-3xl font-bold ${color.replace('bg-','text-')} mb-0.5`}>{value ?? '--'}</p>
      <p className="text-xs font-semibold text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function TopicRow({ topic }) {
  const isEmergency = topic.toLowerCase().includes('emergency')
  const isDlt       = topic.toLowerCase().includes('dlt')
  const isDispatch  = topic.toLowerCase().includes('dispatch')
  const color = isDlt ? 'text-red-400' : isEmergency ? 'text-orange-400' : isDispatch ? 'text-green-400' : 'text-blue-400'
  const bg    = isDlt ? 'bg-red-500'   : isEmergency ? 'bg-orange-500'   : isDispatch ? 'bg-green-500'   : 'bg-blue-500'
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0 group hover:bg-slate-800 hover:bg-opacity-30 px-2 -mx-2 rounded transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${bg}`}/>
        <span className={`text-sm font-mono font-medium ${color}`}>{topic}</span>
        {isDlt && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500 bg-opacity-10 text-red-400 border border-red-500 border-opacity-20">DLT</span>}
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <div className={`w-1.5 h-1.5 rounded-full ${bg} animate-pulse`}/>
        <span className="text-xs">Active</span>
      </div>
    </div>
  )
}

function PartitionBar({ partition }) {
  const lag = partition.lag ?? 0
  const pct = partition.endOffset > 0 ? Math.round((partition.committedOffset / partition.endOffset)*100) : 100
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">{partition.partition}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white truncate max-w-36">{partition.topic}</p>
            <p className="text-xs text-slate-600">Partition {partition.partition}</p>
          </div>
        </div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
          lag===0
            ? 'text-green-400 border-green-500 border-opacity-30 bg-green-500 bg-opacity-10'
            : 'text-red-400 border-red-500 border-opacity-30 bg-red-500 bg-opacity-10'
        }`}>
          {lag===0 ? 'HEALTHY' : `LAG ${lag}`}
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Consumed</span>
          <span className="text-white font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${lag===0?'bg-green-500':'bg-red-500'}`} style={{width:pct+'%'}}/>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div><p className="text-xs text-slate-600">Committed</p><p className="text-xs font-mono text-white">{partition.committedOffset}</p></div>
          <div><p className="text-xs text-slate-600">End Offset</p><p className="text-xs font-mono text-white">{partition.endOffset}</p></div>
        </div>
      </div>
    </div>
  )
}

export default function KafkaMonitor() {
  const { data:lag, isLoading:lagLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['kafka-lag'],
    queryFn:  () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 5000,
  })
  const { data:topics, isLoading:topicsLoading } = useQuery({
    queryKey: ['kafka-topics'],
    queryFn:  () => api.get('/api/monitoring/kafka/topics').then(r => r.data),
    refetchInterval: 15000,
  })

  const groups     = lag?.consumerGroups ?? []
  const topicList  = topics?.topics ? [...topics.topics].sort() : []
  const allHealthy = lag?.overallStatus === 'HEALTHY'
  const totalLag   = groups.reduce((s,g) => s+(g.totalLag??0), 0)
  const totalParts = groups.reduce((s,g) => s+(g.partitions?.length??0), 0)
  const lastSync   = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  const lagChartData = groups.flatMap(g =>
    (g.partitions??[]).map(p => ({
      name:   `${g.groupId.split('-')[0]}.P${p.partition}`,
      lag:    p.lag ?? 0,
      offset: p.committedOffset ?? 0,
    }))
  )

  const offsetChartData = groups.flatMap(g =>
    (g.partitions??[]).map(p => ({
      name:       `${p.topic?.split('-')[0] ?? ''}.P${p.partition}`,
      committed:  p.committedOffset ?? 0,
      end:        p.endOffset ?? 0,
    }))
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kafka Pipeline Monitor</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Event streaming health · Consumer group lag · Partition offsets
            <span className="text-slate-600 ml-2">· synced {lastSync}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
            allHealthy
              ? 'bg-green-500 bg-opacity-10 border-green-500 border-opacity-30 text-green-400'
              : 'bg-red-500 bg-opacity-10 border-red-500 border-opacity-30 text-red-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${allHealthy?'bg-green-400':'bg-red-400'}`}/>
            {allHealthy ? 'Pipeline Healthy' : 'Pipeline Lagging'}
          </div>
          <button onClick={()=>refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-all hover:border-slate-500">
            <RefreshCw className="w-3.5 h-3.5"/>Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Consumer Groups"  value={groups.length}  icon={Layers}    color="bg-blue-500"   sub="Active groups"       pulse/>
        <StatCard label="Total Lag"        value={totalLag}       icon={AlertTriangle} color={totalLag===0?"bg-green-500":"bg-red-500"} sub="Messages behind" pulse={totalLag>0}/>
        <StatCard label="Partitions"       value={totalParts}     icon={BarChart2} color="bg-purple-500" sub="Being consumed"/>
        <StatCard label="Kafka Topics"     value={topicList.length} icon={Database} color="bg-amber-500" sub="Active topics"/>
      </div>

      {/* Consumer groups + topics */}
      <div className="grid grid-cols-3 gap-4">
        {/* Consumer Groups */}
        <div className="col-span-2 space-y-4">
          {lagLoading ? (
            <div className="h-48 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"/>
          ) : groups.map(group => {
            const healthy  = group.status === 'HEALTHY'
            const groupLag = group.totalLag ?? 0
            return (
              <div key={group.groupId} className={`bg-slate-900 border rounded-xl overflow-hidden ${
                healthy ? 'border-slate-800' : 'border-red-500 border-opacity-20'
              }`}>
                <div className={`px-5 py-4 border-b flex items-center justify-between ${
                  healthy ? 'border-slate-800 bg-black bg-opacity-20' : 'border-red-500 border-opacity-20 bg-red-500 bg-opacity-5'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${healthy?'bg-green-400 animate-pulse':'bg-red-400'}`}/>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {group.groupId==='dispatch-service-group' ? 'Dispatch Consumer Group' : 'Dead Letter Topic Group'}
                      </p>
                      <p className="text-xs font-mono text-slate-500">{group.groupId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${groupLag===0?'text-green-400':'text-red-400'}`}>{groupLag}</p>
                      <p className="text-xs text-slate-600">total lag</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      healthy
                        ? 'text-green-400 border-green-500 border-opacity-30 bg-green-500 bg-opacity-10'
                        : 'text-red-400 border-red-500 border-opacity-30 bg-red-500 bg-opacity-10'
                    }`}>{group.status}</div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {(group.partitions??[]).map((p,i) => <PartitionBar key={i} partition={p}/>)}
                  {(!group.partitions || group.partitions.length===0) && (
                    <div className="col-span-2 py-8 text-center">
                      <Radio className="w-6 h-6 text-slate-700 mx-auto mb-2"/>
                      <p className="text-xs text-slate-600">No partition data — Kafka may be initializing</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {!lagLoading && groups.length===0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
              <Server className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
              <p className="text-white font-medium text-sm mb-1">No consumer group data</p>
              <p className="text-slate-600 text-xs">Kafka broker may be starting up</p>
            </div>
          )}
        </div>

        {/* Topics + pipeline info */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-amber-400"/>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kafka Topics</h3>
            </div>
            {topicsLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="h-8 bg-slate-800 rounded animate-pulse"/>)}</div>
            ) : topicList.length===0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">No topics found</p>
            ) : (
              <div>{topicList.map(t=><TopicRow key={t} topic={t}/>)}</div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-blue-400"/>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pipeline Config</h3>
            </div>
            <div className="space-y-3">
              {[
                {label:'Broker',       value:'localhost:9092'},
                {label:'Version',      value:'Kafka 3.7.1'  },
                {label:'Partitions',   value:'6 (emergency-events)'},
                {label:'Replication',  value:'Factor 1'     },
                {label:'DLT Strategy', value:'Auto-retry x3'},
                {label:'Commit Mode',  value:'Auto-commit'  },
              ].map(({label,value}) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-mono font-medium text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lag Chart */}
      {lagChartData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Consumer Lag by Partition</h3>
              <p className="text-xs text-slate-500 mt-0.5">Messages behind per partition · 0 = fully consumed</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${allHealthy?'text-green-400':'text-red-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${allHealthy?'bg-green-400':'bg-red-400'} animate-pulse`}/>
              {allHealthy ? 'All caught up' : `${totalLag} messages behind`}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={lagChartData} margin={{top:4,right:4,left:-20,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>} cursor={{fill:'#1e293b80'}}/>
              <Bar dataKey="lag" radius={[4,4,0,0]} maxBarSize={48} name="Lag">
                {lagChartData.map((d,i)=>(
                  <Cell key={i} fill={d.lag===0?'#22c55e':'#ef4444'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Offset Chart */}
      {offsetChartData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Committed vs End Offsets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Blue = committed · Purple = end offset</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={offsetChartData} margin={{top:4,right:4,left:-20,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>} cursor={{fill:'#1e293b80'}}/>
              <Bar dataKey="committed" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={32} name="Committed"/>
              <Bar dataKey="end"       fill="#8b5cf6" radius={[4,4,0,0]} maxBarSize={32} name="End Offset"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}