import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, Plus, X, MapPin, Filter, RefreshCw,
  Flame, Heart, Shield, CloudLightning, Eye, Search,
  ChevronDown, ChevronUp, Download, Clock, Zap,
  CheckCircle, Radio, ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const TYPE_CONFIG = {
  FIRE:     { icon: Flame,          color: '#ef4444', bg: 'bg-red-500',    text: 'text-red-400',    border: 'border-l-red-500',    label: 'Fire'     },
  MEDICAL:  { icon: Heart,          color: '#3b82f6', bg: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-l-blue-500',   label: 'Medical'  },
  POLICE:   { icon: Shield,         color: '#f59e0b', bg: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-l-amber-500',  label: 'Police'   },
  DISASTER: { icon: CloudLightning, color: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-l-purple-500', label: 'Disaster' },
}

const STATUS_CONFIG = {
  REPORTED:   { color: 'text-yellow-400', bg: 'bg-yellow-500', dot: 'bg-yellow-400', step: 1, pulse: false },
  DISPATCHED: { color: 'text-green-400',  bg: 'bg-green-500',  dot: 'bg-green-400',  step: 2, pulse: true  },
  RESOLVED:   { color: 'text-blue-400',   bg: 'bg-blue-500',   dot: 'bg-blue-400',   step: 3, pulse: false },
  CANCELLED:  { color: 'text-slate-400',  bg: 'bg-slate-500',  dot: 'bg-slate-400',  step: 0, pulse: false },
}

const SEVERITY_LABELS = { 5:'CRITICAL', 4:'HIGH', 3:'MEDIUM', 2:'LOW', 1:'MINIMAL' }
const SEVERITY_COLORS = {
  5: 'text-red-400',    4: 'text-orange-400',
  3: 'text-yellow-400', 2: 'text-blue-400', 1: 'text-slate-400',
}

const CITIES = ['mumbai', 'delhi', 'bangalore']
const TYPES  = ['FIRE', 'MEDICAL', 'POLICE', 'DISASTER']

function StatusTimeline({ status }) {
  const steps = [
    { key:'REPORTED',   label:'Reported',   icon:AlertTriangle, desc:'SOS submitted — awaiting dispatch' },
    { key:'DISPATCHED', label:'Dispatched', icon:Zap,           desc:'Nearest unit assigned via Haversine' },
    { key:'RESOLVED',   label:'Resolved',   icon:CheckCircle,   desc:'Incident successfully closed' },
  ]
  const current = STATUS_CONFIG[status]?.step ?? 0
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const StepIcon  = step.icon
        const isDone    = idx < current
        const isCurrent = idx === current - 1
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isDone || isCurrent
                  ? 'border-green-500 bg-green-500 bg-opacity-20'
                  : 'border-slate-700 bg-slate-800'
              }`}>
                <StepIcon className={`w-3.5 h-3.5 ${isDone || isCurrent ? 'text-green-400' : 'text-slate-600'}`} />
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-0.5 h-8 mt-0.5 ${isDone ? 'bg-green-500 bg-opacity-40' : 'bg-slate-800'}`} />
              )}
            </div>
            <div className="pt-1.5 pb-5">
              <p className={`text-sm font-semibold ${isDone || isCurrent ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
              {isCurrent && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Current status</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailModal({ incident, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const tc = TYPE_CONFIG[incident.type]   || { icon: AlertTriangle, color:'#64748b', label: incident.type }
  const sc = STATUS_CONFIG[incident.status] || { color:'text-slate-400' }
  const Icon = tc.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tc.color + '20', border: `1px solid ${tc.color}40` }}>
              <Icon className="w-5 h-5" style={{ color: tc.color }} />
            </div>
            <div>
              <h2 className="text-white font-bold">{tc.label} Incident</h2>
              <p className="text-slate-600 text-xs font-mono">{incident.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sc.color} bg-slate-800`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.pulse ? 'animate-pulse' : ''}`} />
              {incident.status}
            </div>
            <span className="text-xs text-slate-600">ESC</span>
            <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Incident Details</h3>
              <div className="bg-slate-800 rounded-xl p-4 space-y-3 border border-slate-700">
                {[
                  { label:'Type',        value: <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: tc.color+'20', color: tc.color }}>{incident.type}</span> },
                  { label:'City',        value: <span className="text-xs font-medium text-white capitalize">{incident.city}</span> },
                  { label:'Description', value: <span className="text-xs text-slate-300 leading-relaxed">{incident.description || 'N/A'}</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-slate-500">{label}</span>
                    {value}
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Severity</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-3.5 rounded-sm ${i < incident.severity ? 'bg-red-500' : 'bg-slate-700'}`} />
                    ))}
                    <span className={`text-xs font-bold ml-1.5 ${SEVERITY_COLORS[incident.severity]}`}>
                      {SEVERITY_LABELS[incident.severity]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">GPS Location</h3>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
                <div className="flex justify-between"><span className="text-xs text-slate-500">Latitude</span><span className="text-xs font-mono text-white">{incident.latitude}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Longitude</span><span className="text-xs font-mono text-white">{incident.longitude}</span></div>
                <div className="h-20 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 capitalize">{incident.city}</p>
                    <p className="text-xs font-mono text-slate-600">{incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Status Timeline</h3>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <StatusTimeline status={incident.status} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Technical</h3>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs text-slate-500">Incident ID</span>
                  <span className="text-xs font-mono text-slate-400 break-all text-right max-w-40">{incident.id}</span>
                </div>
                {incident.reporterId && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs text-slate-500">Reporter</span>
                    <span className="text-xs font-mono text-slate-400">{incident.reporterId?.slice(0,16)}...</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Pipeline</span>
                  <span className="text-xs font-bold text-green-400">Kafka · {incident.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    type:'MEDICAL', severity:3, city:'mumbai',
    latitude:19.0760, longitude:72.8777, description:''
  })
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const cityCoords = {
    mumbai:    { latitude:19.0760, longitude:72.8777 },
    delhi:     { latitude:28.6139, longitude:77.2090 },
    bangalore: { latitude:12.9716, longitude:77.5946 },
  }

  const mutation = useMutation({
    mutationFn: data => api.post('/api/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents-list'])
      toast.success('Incident created — dispatching...')
      onClose()
    },
    onError: () => toast.error('Failed to create incident'),
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold">Submit Emergency SOS</h2>
            <p className="text-slate-500 text-xs mt-0.5">Nearest responder auto-assigned via Haversine algorithm</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Incident Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => {
                const { icon:Icon, color, label } = TYPE_CONFIG[t]
                return (
                  <button key={t} onClick={() => setForm({...form, type:t})}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                      form.type === t
                        ? 'border-opacity-60 text-white'
                        : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-white'
                    }`}
                    style={form.type === t ? { borderColor: color, background: color+'15', color } : {}}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">City</label>
            <div className="grid grid-cols-3 gap-2">
              {CITIES.map(c => (
                <button key={c} onClick={() => setForm({...form, city:c, ...cityCoords[c]})}
                  className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                    form.city === c
                      ? 'border-blue-500 bg-blue-500 bg-opacity-15 text-blue-400'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-white'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Severity — <span className="text-red-400">{form.severity}/5 · {SEVERITY_LABELS[form.severity]}</span>
            </label>
            <input type="range" min="1" max="5" value={form.severity}
              onChange={e => setForm({...form, severity:parseInt(e.target.value)})}
              className="w-full accent-red-500" />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Minimal</span><span>Critical</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['latitude','longitude'].map(f => (
              <div key={f}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 capitalize">{f}</label>
                <input type="number" step="0.0001" value={form[f]}
                  onChange={e => setForm({...form, [f]:parseFloat(e.target.value)})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})}
              placeholder="Describe the emergency situation..." rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition-all">
            Cancel
          </button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Dispatching...</>
              : <><AlertTriangle className="w-4 h-4"/>Submit SOS</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Incidents() {
  const [showCreate,   setShowCreate]   = useState(false)
  const [selected,     setSelected]     = useState(null)
  const [filterCity,   setFilterCity]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [search,       setSearch]       = useState('')
  const [sortField,    setSortField]    = useState('severity')
  const [sortDir,      setSortDir]      = useState('desc')
  const searchRef = useRef(null)

  useEffect(() => {
    const h = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); searchRef.current?.focus() }
      if ((e.metaKey||e.ctrlKey) && e.key==='n') { e.preventDefault(); setShowCreate(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const { data:incidents, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['incidents-list'],
    queryFn:  () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 5000,
  })

  const handleSort = field => {
    if (sortField===field) setSortDir(d => d==='asc'?'desc':'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = (incidents ?? [])
    .filter(i => {
      if (filterCity   && i.city   !== filterCity)   return false
      if (filterStatus && i.status !== filterStatus)  return false
      if (filterType   && i.type   !== filterType)    return false
      if (search) {
        const q = search.toLowerCase()
        return i.id?.toLowerCase().includes(q) || i.city?.toLowerCase().includes(q) ||
               i.type?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a,b) => {
      const dir = sortDir==='asc' ? 1 : -1
      if (sortField==='severity') return (a.severity-b.severity)*dir
      if (sortField==='city')     return a.city?.localeCompare(b.city)*dir
      if (sortField==='type')     return a.type?.localeCompare(b.type)*dir
      if (sortField==='status')   return a.status?.localeCompare(b.status)*dir
      return 0
    })

  const dispatched = filtered.filter(i=>i.status==='DISPATCHED').length
  const reported   = filtered.filter(i=>i.status==='REPORTED').length
  const critical   = filtered.filter(i=>i.severity>=4).length
  const lastSync   = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  const exportCSV = () => {
    const rows = [['ID','Type','City','Severity','Status','Description']]
    filtered.forEach(i => rows.push([i.id,i.type,i.city,i.severity,i.status,i.description||'']))
    const csv  = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href=url; a.download='incidents.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} incidents`)
  }

  const SortIcon = ({ field }) => {
    if (sortField!==field) return <ChevronDown className="w-3 h-3 text-slate-600 opacity-40"/>
    return sortDir==='asc' ? <ChevronUp className="w-3 h-3 text-blue-400"/> : <ChevronDown className="w-3 h-3 text-blue-400"/>
  }

  const COLS = [
    {key:null,      label:'ID'         },
    {key:'type',    label:'Type'       },
    {key:'city',    label:'Location'   },
    {key:'severity',label:'Severity'   },
    {key:null,      label:'Description'},
    {key:'status',  label:'Status'     },
    {key:null,      label:''           },
  ]

  return (
    <div className="space-y-5">
      {showCreate  && <CreateModal    onClose={() => setShowCreate(false)} />}
      {selected    && <DetailModal    incident={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incident Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            <span className="text-white font-medium">{filtered.length}</span> of {(incidents??[]).length} incidents
            {dispatched>0 && <span className="text-green-400 ml-2">· {dispatched} dispatched</span>}
            {reported>0   && <span className="text-yellow-400 ml-2">· {reported} pending</span>}
            {critical>0   && <span className="text-red-400 ml-2">· {critical} critical</span>}
            <span className="text-slate-600 ml-2">· synced {lastSync}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-all hover:border-slate-500">
            <Download className="w-3.5 h-3.5"/>Export CSV
          </button>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-all hover:border-slate-500">
            <RefreshCw className="w-3.5 h-3.5"/>Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow-lg">
            <Plus className="w-4 h-4"/>New Incident
            <span className="text-xs text-red-300 ml-1">⌘N</span>
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600"/>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search incidents... (⌘K)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"/>
          {search && (
            <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
              <X className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
        <Filter className="w-3.5 h-3.5 text-slate-600"/>
        {[
          {value:filterCity,   set:setFilterCity,   opts:CITIES,                     ph:'All Cities'   },
          {value:filterStatus, set:setFilterStatus, opts:Object.keys(STATUS_CONFIG), ph:'All Statuses' },
          {value:filterType,   set:setFilterType,   opts:TYPES,                      ph:'All Types'    },
        ].map(({value,set,opts,ph},i) => (
          <select key={i} value={value} onChange={e=>set(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors">
            <option value="">{ph}</option>
            {opts.map(o=><option key={o} value={o}>{o.charAt(0)+o.slice(1).toLowerCase()}</option>)}
          </select>
        ))}
        {(filterCity||filterStatus||filterType||search) && (
          <button onClick={()=>{setFilterCity('');setFilterStatus('');setFilterType('');setSearch('')}}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500 hover:bg-opacity-10">
            <X className="w-3 h-3"/>Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          Auto-refresh 5s
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-black bg-opacity-30">
              {COLS.map(({key,label}) => (
                <th key={label} onClick={()=>key&&handleSort(key)}
                  className={`px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest ${key?'cursor-pointer hover:text-white transition-colors select-none':''}`}>
                  <div className="flex items-center gap-1">{label}{key&&<SortIcon field={key}/>}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_,i) => (
                <tr key={i} className="border-b border-slate-800">
                  {[...Array(7)].map((_,j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse"/></td>
                  ))}
                </tr>
              ))
            ) : filtered.length===0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Radio className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
                  <p className="text-white font-medium text-sm mb-1">{search?`No results for "${search}"`:'No incidents found'}</p>
                  <p className="text-slate-600 text-xs">System standing by — all clear</p>
                </td>
              </tr>
            ) : (
              filtered.map(inc => {
                const tc = TYPE_CONFIG[inc.type]     || {icon:AlertTriangle,color:'#64748b',label:inc.type,border:'border-l-slate-500'}
                const sc = STATUS_CONFIG[inc.status] || {color:'text-slate-400',dot:'bg-slate-400',pulse:false}
                const Icon = tc.icon
                return (
                  <tr key={inc.id} onClick={()=>setSelected(inc)}
                    className={`border-b border-slate-800 hover:bg-slate-800 hover:bg-opacity-50 cursor-pointer group border-l-2 ${tc.border} transition-all`}>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-600 group-hover:text-slate-300 transition-colors">{inc.id?.slice(0,8)}...</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{color:tc.color}}/>
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:tc.color+'20',color:tc.color}}>{inc.type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-600"/>
                        <span className="text-sm text-slate-300 capitalize">{inc.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_,i) => (
                          <div key={i} className={`w-1.5 h-3.5 rounded-sm ${i<inc.severity?'bg-red-500':'bg-slate-800'}`}/>
                        ))}
                        <span className={`text-xs font-bold ml-1.5 ${SEVERITY_COLORS[inc.severity]}`}>{inc.severity}/5</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-500 truncate max-w-40 block group-hover:text-slate-300 transition-colors">{inc.description||'—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot} ${sc.pulse?'animate-pulse':''}`}/>
                        <span className={`text-xs font-bold ${sc.color}`}>{inc.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-slate-600 group-hover:text-blue-400 transition-colors">
                        <Eye className="w-3.5 h-3.5"/><span className="text-xs">View</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {filtered.length>0 && (
          <div className="px-5 py-3 border-t border-slate-800 bg-black bg-opacity-20 flex items-center justify-between">
            <p className="text-xs text-slate-600">Showing {filtered.length} incident{filtered.length!==1?'s':''}{(incidents??[]).length!==filtered.length&&` of ${(incidents??[]).length}`}</p>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>Click row to view details</span><span>·</span>
              <span>⌘K search</span><span>·</span><span>⌘N new</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}