import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus, X, MapPin, Filter, RefreshCw, Flame, Heart, Shield, CloudLightning } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const TYPE_CONFIG = {
  FIRE:     { icon: Flame,          color: 'text-danger bg-danger',   label: 'Fire' },
  MEDICAL:  { icon: Heart,          color: 'text-accent bg-accent',   label: 'Medical' },
  POLICE:   { icon: Shield,         color: 'text-warning bg-warning', label: 'Police' },
  DISASTER: { icon: CloudLightning, color: 'text-danger bg-danger',   label: 'Disaster' },
}

const STATUS_CONFIG = {
  REPORTED:   { color: 'text-warning bg-warning',  dot: 'bg-warning' },
  DISPATCHED: { color: 'text-success bg-success',  dot: 'bg-success' },
  RESOLVED:   { color: 'text-accent bg-accent',    dot: 'bg-accent' },
  CANCELLED:  { color: 'text-muted bg-muted',      dot: 'bg-muted' },
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

function CreateModal({ onClose }) {
  const queryClient = useQueryClient()
  const { userId } = useAuthStore()
  const [form, setForm] = useState({
    type: 'MEDICAL', severity: 3, city: 'mumbai',
    latitude: 19.0760, longitude: 72.8777, description: ''
  })

  const cityCoords = {
    mumbai:    { latitude: 19.0760, longitude: 72.8777 },
    delhi:     { latitude: 28.6139, longitude: 77.2090 },
    bangalore: { latitude: 12.9716, longitude: 77.5946 },
  }

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/incidents/my', data, {
      headers: { 'X-User-Id': userId }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents-list'])
      toast.success('Incident created and dispatching...')
      onClose()
    },
    onError: () => toast.error('Failed to create incident'),
  })

  const handleCityChange = (city) => {
    setForm({ ...form, city, ...cityCoords[city] })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-white font-semibold">Create Incident</h2>
            <p className="text-muted text-xs mt-0.5">Submit emergency SOS â€” dispatch will auto-assign</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Incident Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => {
                const { icon: Icon, color, label } = TYPE_CONFIG[t]
                const [text] = color.split(' ')
                const active = form.type === t
                return (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? `border-accent bg-accent bg-opacity-10 ${text}`
                        : 'border-border text-muted hover:border-accent hover:border-opacity-40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">City</label>
            <div className="grid grid-cols-3 gap-2">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => handleCityChange(c)}
                  className={`py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                    form.city === c
                      ? 'border-accent bg-accent bg-opacity-10 text-accent'
                      : 'border-border text-muted hover:border-accent hover:border-opacity-40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Severity â€” <span className="text-danger font-semibold">{form.severity}/5</span>
            </label>
            <input
              type="range" min="1" max="5" value={form.severity}
              onChange={(e) => setForm({ ...form, severity: parseInt(e.target.value) })}
              className="w-full accent-red-500"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>Low</span><span>Critical</span>
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Latitude</label>
              <input
                type="number" step="0.0001" value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Longitude</label>
              <input
                type="number" step="0.0001" value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the emergency situation..."
              rows={3}
              className="w-full bg-subtle border border-border rounded-lg px-3 py-2 text-white placeholder-muted text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted hover:text-white hover:border-accent hover:border-opacity-40 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Dispatching...</>
            ) : (
              <><AlertTriangle className="w-4 h-4" />Submit SOS</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Incidents() {
  const [showCreate, setShowCreate] = useState(false)
  const [filterCity, setFilterCity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const { data: incidents, isLoading, refetch } = useQuery({
    queryKey: ['incidents-list'],
    queryFn: () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 5000,
  })

  const filtered = (incidents ?? []).filter(i => {
    if (filterCity   && i.city !== filterCity)     return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterType   && i.type !== filterType)     return false
    return true
  })

  return (
    <div className="space-y-5">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Incidents</h1>
          <p className="text-muted text-sm mt-0.5">{filtered.length} incidents {filterCity || filterStatus || filterType ? '(filtered)' : 'total'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted hover:text-white text-sm transition-all">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />New Incident
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Filter className="w-3.5 h-3.5" />Filters:
        </div>
        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterCity || filterStatus || filterType) && (
          <button
            onClick={() => { setFilterCity(''); setFilterStatus(''); setFilterType('') }}
            className="text-xs text-danger hover:text-red-400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">City</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Severity</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Description</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-subtle rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <AlertTriangle className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-muted text-sm">No incidents found</p>
                </td>
              </tr>
            ) : (
              filtered.map(inc => {
                const typeConf   = TYPE_CONFIG[inc.type]   || { icon: AlertTriangle, color: 'text-muted bg-muted', label: inc.type }
                const statusConf = STATUS_CONFIG[inc.status] || { color: 'text-muted bg-muted' }
                const Icon = typeConf.icon
                return (
                  <tr key={inc.id} className="border-b border-border hover:bg-subtle transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-muted">{inc.id?.slice(0, 8)}...</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${typeConf.color.split(' ')[0]}`} />
                        <Badge label={inc.type} colorClass={typeConf.color} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted" />
                        <span className="text-sm text-slate-300 capitalize">{inc.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-1.5 h-3.5 rounded-sm ${i < inc.severity ? 'bg-danger' : 'bg-subtle'}`} />
                        ))}
                        <span className="text-xs text-muted ml-1">{inc.severity}/5</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400 truncate max-w-40 block">{inc.description || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConf.color.split(' ')[1] || 'bg-muted'} bg-opacity-100 ${inc.status === 'DISPATCHED' ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: inc.status === 'DISPATCHED' ? '#22c55e' : inc.status === 'REPORTED' ? '#f59e0b' : '#64748b' }}
                        />
                        <Badge label={inc.status} colorClass={statusConf.color} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}