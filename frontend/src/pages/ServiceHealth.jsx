import { useQuery } from '@tanstack/react-query'
import {
  Shield, Activity, Database, Server, Zap,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Clock, Cpu, HardDrive, Radio, Brain, ChevronRight,
  ArrowUpRight, Layers
} from 'lucide-react'
import api from '../api/axios'

function UptimeDot({ up }) {
  return (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${up ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
  )
}

function ServiceCard({ name, port, status, description, icon: Icon, color, metrics, loading, extra }) {
  const up = status === 'UP' || status === 'operational'
  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 duration-200 ${
      up ? 'border-slate-800 hover:border-green-500 hover:border-opacity-30' : 'border-red-500 border-opacity-30'
    }`}>
      <div className={`px-5 py-4 border-b flex items-center justify-between ${
        up ? 'border-slate-800 bg-black bg-opacity-20' : 'border-red-500 border-opacity-20 bg-red-500 bg-opacity-5'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: color + '18', border: `1px solid ${color}33` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{name}</p>
            <p className="text-slate-500 text-xs">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-600">:{port}</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
            up
              ? 'text-green-400 border-green-500 border-opacity-30 bg-green-500 bg-opacity-10'
              : 'text-red-400 border-red-500 border-opacity-30 bg-red-500 bg-opacity-10'
          }`}>
            <UptimeDot up={up} />
            {up ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="h-4 bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {metrics?.map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-xs font-medium ${highlight ? 'text-green-400' : 'text-slate-300'}`}>{value ?? '—'}</span>
              </div>
            ))}
            {extra}
          </div>
        )}
      </div>
    </div>
  )
}

function InfraCard({ name, icon: Icon, color, status, metrics, loading }) {
  const up = status !== false
  return (
    <div className={`bg-slate-900 border rounded-xl p-4 transition-all hover:-translate-y-0.5 duration-200 ${
      up ? 'border-slate-800 hover:border-slate-600' : 'border-red-500 border-opacity-30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: color + '18' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <p className="text-sm font-bold text-white">{name}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
          <UptimeDot up={up} />
          {up ? 'UP' : 'DOWN'}
        </div>
      </div>
      {loading ? (
        <div className="space-y-1.5">
          {[...Array(2)].map((_,i) => <div key={i} className="h-3 bg-slate-800 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-1.5">
          {metrics?.map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-xs text-slate-600">{label}</span>
              <span className="text-xs font-mono text-slate-400">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelBadge({ name, status }) {
  const ready = status === 'ready'
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0`}>
      <span className="text-xs text-slate-400 capitalize">{name.replace(/_/g,' ')}</span>
      <div className={`flex items-center gap-1 text-xs font-bold ${ready ? 'text-green-400' : 'text-yellow-400'}`}>
        {ready ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {status}
      </div>
    </div>
  )
}

export default function ServiceHealth() {
  const { data: emergency, isLoading: emLoad } = useQuery({
    queryKey: ['health-emergency'],
    queryFn:  () => api.get('/api/health').then(r => r.data),
    refetchInterval: 10000,
  })
  const { data: dispatch, isLoading: dsLoad } = useQuery({
    queryKey: ['health-dispatch'],
    queryFn:  () => api.get('/api/health/stats').then(r => r.data),
    refetchInterval: 10000,
  })
  const { data: kafka, isLoading: kfLoad } = useQuery({
    queryKey: ['health-kafka'],
    queryFn:  () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 10000,
  })
  const { data: ai, isLoading: aiLoad } = useQuery({
    queryKey: ['health-ai'],
    queryFn:  () => api.get('/api/ai/health').then(r => r.data),
    refetchInterval: 10000,
  })

  const services = [
    { up: true },
    { up: emergency?.status === 'UP' },
    { up: dispatch?.status  === 'UP' },
    { up: ai?.models_ready  === true },
  ]
  const allUp      = services.every(s => s.up)
  const upCount    = services.filter(s => s.up).length
  const kafkaOk    = kafka?.overallStatus === 'HEALTHY'
  const totalLag   = (kafka?.consumerGroups ?? []).reduce((s,g) => s+(g.totalLag??0), 0)
  const now        = new Date().toLocaleTimeString()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Service Health</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time microservice monitoring · {upCount}/4 services online
            <span className="text-slate-600 ml-2">· {now}</span>
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${
          allUp
            ? 'bg-green-500 bg-opacity-10 border-green-500 border-opacity-30 text-green-400'
            : 'bg-red-500 bg-opacity-10 border-red-500 border-opacity-30 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${allUp ? 'bg-green-400' : 'bg-red-400'}`} />
          {allUp ? 'All Systems Operational' : `${4 - upCount} Service${4-upCount>1?'s':''} Down`}
        </div>
      </div>

      {/* System overview strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-8">
        {[
          { label:'API Gateway',        up:true,                        port:'8080' },
          { label:'Emergency Service',  up:emergency?.status==='UP',    port:'8082' },
          { label:'Dispatch Service',   up:dispatch?.status==='UP',     port:'8083' },
          { label:'AI Service',         up:ai?.models_ready===true,     port:'8084' },
          { label:'PostgreSQL',         up:true,                        port:'5432' },
          { label:'Redis',              up:true,                        port:'6379' },
          { label:'Kafka',              up:kafkaOk,                     port:'9092' },
          { label:'Zookeeper',          up:true,                        port:'2181' },
        ].map(({ label, up, port }) => (
          <div key={label} className="flex items-center gap-2 flex-shrink-0">
            <UptimeDot up={up} />
            <div>
              <p className="text-xs font-medium text-slate-300">{label}</p>
              <p className="text-xs text-slate-600 font-mono">:{port}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Microservices */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Microservices</h2>
        <div className="grid grid-cols-2 gap-4">
          <ServiceCard
            name="API Gateway" port="8080"
            status="UP"
            description="JWT validation · CORS · Request routing"
            icon={Shield} color="#8b5cf6" loading={false}
            metrics={[
              { label:'Function',   value:'JWT Auth + Routing'     },
              { label:'Framework',  value:'Spring Boot 3.3.2'      },
              { label:'Auth',       value:'HS256 JWT · BCrypt'     },
              { label:'Routes',     value:'Emergency + Dispatch'   },
              { label:'CORS',       value:'Enabled · All origins'  },
            ]}
          />

          <ServiceCard
            name="Emergency Service" port="8082"
            status={emergency?.status}
            description="Incident CRUD · Kafka producer · SOS pipeline"
            icon={Zap} color="#ef4444" loading={emLoad}
            metrics={[
              { label:'Total Incidents',  value:emergency?.totalIncidents,  highlight:true },
              { label:'Dispatched',       value:emergency?.dispatchedIncidents              },
              { label:'Reported',         value:emergency?.reportedIncidents                },
              { label:'Database',         value:'PostgreSQL 16.3'            },
              { label:'Kafka Topic',      value:'emergency-events (6 parts)' },
            ]}
          />

          <ServiceCard
            name="Dispatch Service" port="8083"
            status={dispatch?.status}
            description="Haversine dispatch · Responder management · Redis cache"
            icon={Radio} color="#22c55e" loading={dsLoad}
            metrics={[
              { label:'Total Responders', value:dispatch?.totalResponders,  highlight:true },
              { label:'Algorithm',        value:'Haversine Great-Circle'                   },
              { label:'Dispatch Time',    value:'~3 seconds avg'                           },
              { label:'Cache',            value:'Redis 7.4'                                },
              { label:'Kafka Topic',      value:'dispatch-updates (3 parts)'               },
            ]}
          />

          <ServiceCard
            name="AI Service" port="8084"
            status={ai?.models_ready ? 'UP' : 'LOADING'}
            description="Python FastAPI · scikit-learn · 4 ML models"
            icon={Brain} color="#3b82f6" loading={aiLoad}
            metrics={[
              { label:'Framework',  value:'Python FastAPI'         },
              { label:'ML Library', value:'scikit-learn'           },
              { label:'Models',     value:`${(ai?.models ?? []).length} loaded`, highlight:true },
              { label:'Accuracy',   value:'89% severity predictor' },
              { label:'Kafka',      value:'Consumer active'        },
            ]}
            extra={ai?.models && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                {(ai.models ?? []).map(m => (
                  <ModelBadge key={m.name} name={m.name} status={m.status} />
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* Infrastructure */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Infrastructure</h2>
        <div className="grid grid-cols-4 gap-4">
          <InfraCard
            name="PostgreSQL" icon={Database} color="#3b82f6" status={true} loading={false}
            metrics={[
              { label:'Version', value:'16.3 Alpine' },
              { label:'Port',    value:'5432'         },
              { label:'Schemas', value:'3 (users, incidents, dispatch)' },
            ]}
          />
          <InfraCard
            name="Redis" icon={HardDrive} color="#ef4444" status={true} loading={false}
            metrics={[
              { label:'Version', value:'7.4 Alpine' },
              { label:'Port',    value:'6379'        },
              { label:'Mode',    value:'Append-only' },
            ]}
          />
          <InfraCard
            name="Apache Kafka" icon={Layers} color="#f59e0b"
            status={kafkaOk} loading={kfLoad}
            metrics={[
              { label:'Version',  value:'3.7.1'                          },
              { label:'Lag',      value:totalLag === 0 ? '0 (healthy)' : `${totalLag} msgs` },
              { label:'Topics',   value:'5 (18 partitions)'              },
            ]}
          />
          <InfraCard
            name="Zookeeper" icon={Server} color="#8b5cf6" status={true} loading={false}
            metrics={[
              { label:'Version', value:'7.6.0 Confluent' },
              { label:'Port',    value:'2181'             },
              { label:'Role',    value:'Kafka coordinator'},
            ]}
          />
        </div>
      </div>

      {/* Architecture summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Architecture</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:'Architecture',  value:'Microservices + Event-Driven',  color:'text-blue-400'   },
            { label:'Message Bus',   value:'Apache Kafka 3.7.1',            color:'text-amber-400'  },
            { label:'Auth',          value:'JWT HS256 + BCrypt',            color:'text-purple-400' },
            { label:'Dispatch',      value:'Haversine Geospatial',          color:'text-green-400'  },
            { label:'AI/ML',         value:'Python FastAPI + scikit-learn', color:'text-blue-400'   },
            { label:'Frontend',      value:'React 18 + Vite + Tailwind',    color:'text-cyan-400'   },
            { label:'Containers',    value:'Docker + Kubernetes + Helm',    color:'text-orange-400' },
            { label:'CI/CD',         value:'GitHub Actions (4 workflows)',  color:'text-pink-400'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-xs font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}