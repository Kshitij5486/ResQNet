import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, Plus, X, MapPin, Filter, RefreshCw,
  Flame, Heart, Shield, CloudLightning, Eye, Search,
  ChevronDown, ChevronUp, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const TYPE_CONFIG = {
  FIRE:     { icon: Flame,          color: 'text-danger bg-danger',   label: 'Fire'     },
  MEDICAL:  { icon: Heart,          color: 'text-accent bg-accent',   label: 'Medical'  },
  POLICE:   { icon: Shield,         color: 'text-warning bg-warning', label: 'Police'   },
  DISASTER: { icon: CloudLightning, color: 'text-danger bg-danger',   label: 'Disaster' },
}

const STATUS_CONFIG = {
  REPORTED:   { color: 'text-warning bg-warning',  dot: 'bg-warning', step: 1 },
  DISPATCHED: { color: 'text-success bg-success',  dot: 'bg-success', step: 2 },
  RESOLVED:   { color: 'text-accent bg-accent',    dot: 'bg-accent',  step: 3 },
  CANCELLED:  { color: 'text-muted bg-muted',      dot: 'bg-muted',   step: 0 },
}

const CITIES = ['mumbai', 'delhi', 'bangalore']
const TYPES  = ['FIRE', 'MEDICAL', 'POLICE', 'DISASTER']

function Badge({ label, colorClass }) {
  const [text, bg] = colorClass.split(' ')
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bg} bg-opacity-10 ${text}`}>
      {label}
    </span>
  )
}

function StatusTimeline({ status }) {
  const steps = [
    { key: 'REPORTED',   label: 'Reported',   icon: AlertTriangle, desc: 'Incident submitted by citizen'               },
    { key: 'DISPATCHED', label: 'Dispatched', icon: Shield,        desc: 'Nearest responder assigned via Haversine'    },
    { key: 'RESOLVED',   label: 'Resolved',   icon: Shield,        desc: 'Incident successfully resolved'              },
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
                isDone || isCurrent ? 'border-success bg-success bg-opacity-20' : 'border-border bg-subtle'
              }`}>
                <StepIcon className={`w-3.5 h-3.5 ${isDone || isCurrent ? 'text-success' : 'text-muted'}`} />
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-0.5 h-8 mt-0.5 ${isDone ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
            <div className="pt-1.5 pb-6">
              <p className={`text-sm font-semibold ${isDone || isCurrent ? 'text-white' : 'text-muted'}`}>{step.label}</p>
              <p className="text-xs text-muted mt-0.5">{step.desc}</p>
              {isCurrent && (
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success font-medium">Current status</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IncidentDetailModal({ incident, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const typeConf   = TYPE_CONFIG[incident.type]   || { icon: AlertTriangle, color: 'text-muted bg-muted', label: incident.type }
  const statusConf = STATUS_CONFIG[incident.status] || { color: 'text-muted bg-muted' }
  const Icon       = typeConf.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${typeConf.color.split(' ')[1]} bg-opacity-10 flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${typeConf.color.split(' ')[0]}`} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">{typeConf.label} Incident</h2>
              <p className="text-muted text-xs font-mono">{incident.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={incident.status} colorClass={statusConf.color} />
            <span className="text-xs text-muted ml-1 hidden sm:block">ESC to close</span>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Incident Details</h3>
              <div className="bg-subtle rounded-xl p-4 space-y-3">
                {[
                  { label: 'Type',        value: <Badge label={incident.type} colorClass={typeConf.color} /> },
                  { label: 'City',        value: <span className="text-xs font-medium text-white capitalize">{incident.city}</span> },
                  { label: 'Description', value: <span className="text-xs text-slate-300 text-right max-w-36 leading-relaxed">{incident.description || 'N/A'}</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-muted mt-0.5">{label}</span>
                    {value}
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Severity</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-3.5 rounded-sm ${i < incident.severity ? 'bg-danger' : 'bg-border'}`} />
                    ))}
                    <span className="text-xs text-muted ml-1">{incident.severity}/5</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Location</h3>
              <div className="bg-subtle rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Latitude</span>
                  <span className="text-xs font-mono text-white">{incident.latitude}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Longitude</span>
                  <span className="text-xs font-mono text-white">{incident.longitude}</span>
                </div>
                <div className="h-20 bg-background rounded-lg border border-border flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-4 h-4 text-accent mx-auto mb-1" />
                    <p className="text-xs text-muted capitalize">{incident.city}</p>
                    <p className="text-xs font-mono text-muted">{incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Status Timeline</h3>
              <div className="bg-subtle rounded-xl p-4">
                <StatusTimeline status={incident.status} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Technical Info</h3>
              <div className="bg-subtle rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted">Incident ID</span>
                  <span className="text-xs font-mono text-muted text-right break-all max-w-40">{incident.id}</span>
                </div>
                {incident.reporterId && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted">Reporter</span>
                    <span className="text-xs font-mono text-muted text-right">{incident.reporterId?.slice(0,16)}...</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Pipeline</span>
                  <span className="text-xs font-medium text-success">Kafka · {incident.status}</span>
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
  const { userId }  = useAuthStore()
  const [form, setForm] = useState({
    type: 'MEDICAL', severity: 3, city: 'mumbai',
    latitude: 19.0760, longitude: 72.8777, description: ''
  })

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const cityCoords = {
    mumbai:    { latitude: 19.0760, longitude: 72.8777 },
    delhi:     { latitude: 28.6139, longitude: 77.2090 },
    bangalore: { latitude: 12.9716, longitude: 77.5946 },
  }

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents-list'])
      toast.success('Incident created and dispatching...')
      onClose()
    },
    onError: () => toast.error('Failed to create incident'),
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-white font-semibold">Create Incident</h2>
            <p className="text-muted text-xs mt-0.5">Submit SOS — nearest responder auto-assigned via Haversine</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Incident Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => {
                const { icon: Icon, color, label } = TYPE_CONFIG[t]
                const [text] = color.split(' ')
                const active = form.type === t
                return (
                  <button key={t} onClick={() => setForm({ ...form, type: t })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                      active ? 'border-accent bg-accent bg-opacity-10 text-accent'
                             : 'border-border text-muted hover:border-accent hover:border-opacity-40 hover:text-white'
                    }`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">City</label>
            <div className="grid grid-cols-3 gap-2">
              {CITIES.map(c => (
                <button key={c} onClick={() => setForm({ ...form, city: c, ...cityCoords[c] })}
                  className={`py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                    form.city === c ? 'border-accent bg-accent bg-opacity-10 text-accent'
                                   : 'border-border text-muted hover:border-accent hover:border-opacity-40 hover:text-white'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Severity — <span className="text-danger font-bold">{form.severity}/5</span>
            </label>
            <input type="range" min="1" max="5" value={form.severity}
              onChange={e => setForm({ ...form, severity: parseInt(e.target.value) })}
              className="w-full accent-red-500" />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>Low</span><span>Critical</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['latitude', 'longitude'].map(field => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 capitalize">{field}</label>
                <input type="number" step="0.0001" value={form[field]}
                  onChange={e => setForm({ ...form, [field]: parseFloat(e.target.value) })}
                  className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the emergency situation..."
              rows={3}
              className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-white placeholder-muted text-sm focus:outline-none focus:border-accent transition-colors resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted hover:text-white hover:border-accent hover:border-opacity-40 text-sm font-medium transition-all">
            Cancel
          </button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Dispatching...</>
              : <><AlertTriangle className="w-4 h-4" />Submit SOS</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Incidents() {
  const [showCreate,   setShowCreate]   = useState(false)
  const [selectedInc,  setSelectedInc]  = useState(null)
  const [filterCity,   setFilterCity]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [search,       setSearch]       = useState('')
  const [sortField,    setSortField]    = useState('severity')
  const [sortDir,      setSortDir]      = useState('desc')
  const searchRef = useRef(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setShowCreate(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const { data: incidents, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['incidents-list'],
    queryFn:  () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 5000,
  })

  const handleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-muted opacity-40" />
    return sortDir === 'asc'
      ? <ChevronUp   className="w-3 h-3 text-accent" />
      : <ChevronDown className="w-3 h-3 text-accent" />
  }

  const filtered = (incidents ?? [])
    .filter(i => {
      if (filterCity   && i.city    !== filterCity)   return false
      if (filterStatus && i.status  !== filterStatus) return false
      if (filterType   && i.type    !== filterType)   return false
      if (search) {
        const q = search.toLowerCase()
        return (
          i.id?.toLowerCase().includes(q) ||
          i.city?.toLowerCase().includes(q) ||
          i.type?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.status?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'severity') return (a.severity - b.severity) * dir
      if (sortField === 'city')     return a.city?.localeCompare(b.city)     * dir
      if (sortField === 'type')     return a.type?.localeCompare(b.type)     * dir
      if (sortField === 'status')   return a.status?.localeCompare(b.status) * dir
      return 0
    })

  const exportCSV = () => {
    const rows   = [['ID', 'Type', 'City', 'Severity', 'Status', 'Description', 'Latitude', 'Longitude']]
    filtered.forEach(i => rows.push([i.id, i.type, i.city, i.severity, i.status, i.description || '', i.latitude, i.longitude]))
    const csv    = rows.map(r => r.join(',')).join('\n')
    const blob   = new Blob([csv], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href       = url
    a.download   = 'resqnet-incidents.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported ' + filtered.length + ' incidents')
  }

  const dispatched = filtered.filter(i => i.status === 'DISPATCHED').length
  const reported   = filtered.filter(i => i.status === 'REPORTED').length
  const lastSync   = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  const SORT_COLS = [
    { key: null,       label: 'ID'          },
    { key: 'type',     label: 'Type'        },
    { key: 'city',     label: 'City'        },
    { key: 'severity', label: 'Severity'    },
    { key: null,       label: 'Description' },
    { key: 'status',   label: 'Status'      },
    { key: null,       label: ''            },
  ]

  return (
    <div className="space-y-5">
      {showCreate  && <CreateModal          onClose={() => setShowCreate(false)} />}
      {selectedInc && <IncidentDetailModal  incident={selectedInc} onClose={() => setSelectedInc(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Incidents</h1>
          <p className="text-muted text-sm mt-0.5">
            {filtered.length} of {(incidents ?? []).length} incidents
            {dispatched > 0 && <span className="text-success ml-1.5">· {dispatched} dispatched</span>}
            {reported   > 0 && <span className="text-warning ml-1.5">· {reported} pending</span>}
            <span className="text-muted ml-1.5">· synced {lastSync}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted hover:text-white text-sm transition-all hover:border-accent hover:border-opacity-40">
            <Download className="w-3.5 h-3.5" />Export
          </button>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted hover:text-white text-sm transition-all hover:border-accent hover:border-opacity-40">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-medium transition-all">
            <Plus className="w-4 h-4" />New Incident
            <span className="text-xs text-red-300 ml-1 hidden sm:inline">⌘N</span>
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search incidents... (⌘K)"
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Filter className="w-3.5 h-3.5" />
        </div>

        {[
          { value: filterCity,   set: setFilterCity,   opts: CITIES,                     ph: 'All Cities'   },
          { value: filterStatus, set: setFilterStatus, opts: Object.keys(STATUS_CONFIG), ph: 'All Statuses' },
          { value: filterType,   set: setFilterType,   opts: TYPES,                      ph: 'All Types'    },
        ].map(({ value, set, opts, ph }, i) => (
          <select key={i} value={value} onChange={e => set(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-accent transition-colors">
            <option value="">{ph}</option>
            {opts.map(o => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
          </select>
        ))}

        {(filterCity || filterStatus || filterType || search) && (
          <button onClick={() => { setFilterCity(''); setFilterStatus(''); setFilterType(''); setSearch('') }}
            className="flex items-center gap-1 text-xs text-danger hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-danger hover:bg-opacity-10">
            <X className="w-3 h-3" />Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Auto-refresh 5s
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              {SORT_COLS.map(({ key, label }) => (
                <th key={label}
                  onClick={() => key && handleSort(key)}
                  className={`px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider ${key ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}>
                  <div className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon field={key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-subtle rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Search className="w-8 h-8 text-muted mx-auto mb-3" />
                  <p className="text-white font-medium text-sm mb-1">
                    {search ? `No results for "${search}"` : 'No incidents found'}
                  </p>
                  <p className="text-muted text-xs">
                    {search ? 'Try a different search term' : 'Try adjusting your filters or create a new incident'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map(inc => {
                const typeConf   = TYPE_CONFIG[inc.type]     || { icon: AlertTriangle, color: 'text-muted bg-muted', label: inc.type }
                const statusConf = STATUS_CONFIG[inc.status] || { color: 'text-muted bg-muted', dot: 'bg-muted' }
                const Icon       = typeConf.icon
                return (
                  <tr key={inc.id}
                    onClick={() => setSelectedInc(inc)}
                    className="border-b border-border hover:bg-subtle transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-muted group-hover:text-slate-300 transition-colors">{inc.id?.slice(0, 8)}...</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${typeConf.color.split(' ')[0]}`} />
                        <Badge label={inc.type} colorClass={typeConf.color} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted" />
                        <span className="text-sm text-slate-300 capitalize">{inc.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-1.5 h-3.5 rounded-sm ${i < inc.severity ? 'bg-danger' : 'bg-subtle'}`} />
                        ))}
                        <span className="text-xs text-muted ml-1">{inc.severity}/5</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-400 truncate max-w-40 block">{inc.description || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConf.dot} ${inc.status === 'DISPATCHED' ? 'animate-pulse' : ''}`} />
                        <Badge label={inc.status} colorClass={statusConf.color} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-muted group-hover:text-accent transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs">View</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted">
              Showing {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
              {(incidents ?? []).length !== filtered.length && ` (filtered from ${(incidents ?? []).length})`}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>Click row to view details</span>
              <span>·</span>
              <span>⌘K to search</span>
              <span>·</span>
              <span>⌘N new incident</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}