import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users, MapPin, Phone, Car, Filter, CheckCircle,
  XCircle, AlertTriangle, Search, X, RefreshCw,
  Zap, Shield, Activity, Clock
} from 'lucide-react'
import api from '../api/axios'

const CITIES = ['mumbai', 'delhi', 'bangalore']

const TYPE_COLORS = {
  AMBULANCE: { text: 'text-accent',  bg: 'bg-accent',  label: 'Ambulance', dot: '#3b82f6' },
  FIRE:      { text: 'text-danger',  bg: 'bg-danger',  label: 'Fire Unit', dot: '#ef4444' },
  POLICE:    { text: 'text-warning', bg: 'bg-warning', label: 'Police',    dot: '#f59e0b' },
}

function ResponderDetailModal({ responder, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const type    = TYPE_COLORS[responder.type] || { text: 'text-muted', bg: 'bg-muted', label: responder.type, dot: '#64748b' }
  const isAvail = responder.status === 'AVAILABLE'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${type.bg} bg-opacity-10 border ${type.bg} border-opacity-20 flex items-center justify-center`}>
              <Users className={`w-5 h-5 ${type.text}`} />
            </div>
            <div>
              <h2 className="text-white font-bold">{responder.name}</h2>
              <p className="text-muted text-xs">{type.label} · Port 8083</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
              isAvail
                ? 'bg-success bg-opacity-10 border-success border-opacity-30 text-success'
                : 'bg-danger bg-opacity-10 border-danger border-opacity-30 text-danger'
            }`}>
              {isAvail ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {responder.status}
            </div>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className={`rounded-xl p-4 border ${
            isAvail
              ? 'bg-success bg-opacity-5 border-success border-opacity-20'
              : 'bg-danger bg-opacity-5 border-danger border-opacity-20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${isAvail ? 'bg-success' : 'bg-danger'} bg-opacity-20 flex items-center justify-center`}>
                {isAvail
                  ? <CheckCircle className="w-5 h-5 text-success" />
                  : <Zap className="w-5 h-5 text-danger" />
                }
              </div>
              <div>
                <p className={`text-sm font-bold ${isAvail ? 'text-success' : 'text-danger'}`}>
                  {isAvail ? 'Available for Dispatch' : 'Currently On Duty'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {isAvail
                    ? 'This responder can be assigned to new incidents'
                    : 'Handling an active incident via Kafka dispatch'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-subtle rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Unit Info</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Vehicle ID</p>
                    <p className="text-xs font-semibold text-white">{responder.vehicleId || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Phone</p>
                    <p className="text-xs font-semibold text-white">{responder.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Unit Type</p>
                    <p className={`text-xs font-semibold ${type.text}`}>{type.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">City</p>
                    <p className="text-xs font-semibold text-white capitalize">{responder.city}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-subtle rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">GPS Location</h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-muted mb-0.5">Latitude</p>
                  <p className="text-xs font-mono font-semibold text-white">{responder.latitude?.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">Longitude</p>
                  <p className="text-xs font-mono font-semibold text-white">{responder.longitude?.toFixed(6)}</p>
                </div>
              </div>
              <div className="h-20 bg-background rounded-lg border border-border flex items-center justify-center mt-2">
                <div className="text-center">
                  <div style={{ width:10, height:10, borderRadius:'50%', background: type.dot, margin:'0 auto 6px', boxShadow:`0 0 8px ${type.dot}` }} />
                  <p className="text-xs font-mono text-muted">{responder.latitude?.toFixed(4)}</p>
                  <p className="text-xs font-mono text-muted">{responder.longitude?.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Incident */}
          {responder.currentIncidentId && (
            <div className="bg-warning bg-opacity-5 border border-warning border-opacity-20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <p className="text-sm font-semibold text-warning">Active Incident</p>
              </div>
              <p className="text-xs text-muted mb-1">Currently assigned to:</p>
              <p className="text-xs font-mono text-white break-all">{responder.currentIncidentId}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                <p className="text-xs text-warning">Dispatched via Kafka · Haversine algorithm</p>
              </div>
            </div>
          )}

          {/* Capabilities */}
          <div className="bg-subtle rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {responder.type === 'AMBULANCE' && ['Emergency Medical', 'Patient Transport', 'First Aid', 'Defibrillation'].map(c => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-accent bg-opacity-10 text-accent border border-accent border-opacity-20">{c}</span>
              ))}
              {responder.type === 'FIRE' && ['Fire Suppression', 'Rescue Operations', 'Hazmat Response', 'Search & Rescue'].map(c => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20">{c}</span>
              ))}
              {responder.type === 'POLICE' && ['Law Enforcement', 'Traffic Control', 'Crowd Management', 'Investigation'].map(c => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted">ESC to close</p>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Activity className="w-3 h-3" />
            <span>Live data · auto-refreshes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResponderCard({ responder, onClick }) {
  const type    = TYPE_COLORS[responder.type] || { text: 'text-muted', bg: 'bg-muted', label: responder.type, dot: '#64748b' }
  const isAvail = responder.status === 'AVAILABLE'

  return (
    <div
      onClick={() => onClick(responder)}
      className={`bg-card border rounded-xl p-4 transition-all cursor-pointer group ${
        isAvail
          ? 'border-border hover:border-success hover:border-opacity-40 hover:shadow-lg hover:shadow-success hover:shadow-opacity-5'
          : 'border-danger border-opacity-20 hover:border-opacity-40'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg ${type.bg} bg-opacity-10 flex items-center justify-center`}>
            <Users className={`w-4 h-4 ${type.text}`} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight group-hover:text-accent transition-colors">{responder.name}</p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${type.bg} bg-opacity-10 ${type.text}`}>
              {type.label}
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isAvail ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'
        }`}>
          {isAvail ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {responder.status}
        </div>
      </div>

      <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
        {responder.vehicleId && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Car className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{responder.vehicleId}</span>
          </div>
        )}
        {responder.phoneNumber && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{responder.phoneNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{responder.latitude?.toFixed(4)}, {responder.longitude?.toFixed(4)}</span>
        </div>
        {responder.currentIncidentId && (
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
            <span className="text-xs font-mono text-warning truncate">{responder.currentIncidentId?.slice(0, 14)}...</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-accent text-center">Click to view details</p>
      </div>
    </div>
  )
}

function CitySection({ city, filterStatus, search, onSelectResponder }) {
  const { data: all = [], isLoading } = useQuery({
    queryKey:       ['responders-all', city],
    queryFn:        () => api.get('/api/responders?city=' + city).then(r => r.data),
    refetchInterval: 10000,
  })

  const available = all.filter(r => r.status === 'AVAILABLE')
  const busy      = all.filter(r => r.status === 'BUSY')
  const pct       = all.length > 0 ? Math.round((available.length / all.length) * 100) : 0

  const displayed = all
    .filter(r => {
      if (filterStatus === 'AVAILABLE' && r.status !== 'AVAILABLE') return false
      if (filterStatus === 'BUSY'      && r.status !== 'BUSY')      return false
      if (search) {
        const q = search.toLowerCase()
        return r.name?.toLowerCase().includes(q) ||
               r.type?.toLowerCase().includes(q) ||
               r.vehicleId?.toLowerCase().includes(q) ||
               r.phoneNumber?.includes(q)
      }
      return true
    })

  if (search && displayed.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-accent" />
          <h2 className="text-base font-bold text-white capitalize">{city}</h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span><span className="text-success font-semibold">{available.length}</span> available</span>
            <span><span className="text-danger font-semibold">{busy.length}</span> busy</span>
            <span>{all.length} total</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-1.5 bg-subtle rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-warning' : 'bg-danger'}`}
              style={{ width: pct + '%' }}
            />
          </div>
          <span className="text-xs text-muted w-16 text-right">{pct}% available</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-44 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="w-9 h-9 bg-subtle rounded-lg" />
                <div className="flex-1">
                  <div className="h-3.5 bg-subtle rounded mb-1.5 w-3/4" />
                  <div className="h-3 bg-subtle rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-3 bg-subtle rounded" />
                <div className="h-3 bg-subtle rounded w-4/5" />
                <div className="h-3 bg-subtle rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted text-sm">No {filterStatus?.toLowerCase() || ''} responders in {city}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {displayed.map(r => (
            <ResponderCard key={r.id} responder={r} onClick={onSelectResponder} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Responders() {
  const [filterStatus,   setFilterStatus]   = useState('')
  const [search,         setSearch]         = useState('')
  const [selectedResp,   setSelectedResp]   = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const cityStats = CITIES.map(city => {
    const { data: all = [] } = useQuery({
      queryKey:       ['responders-all', city],
      queryFn:        () => api.get('/api/responders?city=' + city).then(r => r.data),
      refetchInterval: 10000,
    })
    return {
      city,
      available: all.filter(r => r.status === 'AVAILABLE').length,
      busy:      all.filter(r => r.status === 'BUSY').length,
      total:     all.length,
    }
  })

  const totalAvail = cityStats.reduce((s, c) => s + c.available, 0)
  const totalBusy  = cityStats.reduce((s, c) => s + c.busy,      0)
  const totalAll   = cityStats.reduce((s, c) => s + c.total,     0)

  return (
    <div className="space-y-5">
      {selectedResp && (
        <ResponderDetailModal responder={selectedResp} onClose={() => setSelectedResp(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Responders</h1>
          <p className="text-muted text-sm mt-0.5">
            <span className="text-success font-medium">{totalAvail}</span> available
            <span className="text-muted mx-1.5">·</span>
            <span className="text-danger font-medium">{totalBusy}</span> busy
            <span className="text-muted mx-1.5">·</span>
            {totalAll} total across 3 cities
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search responders... (⌘K)"
            className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-1.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-accent transition-colors">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
          </select>
        </div>

        {(filterStatus || search) && (
          <button onClick={() => { setFilterStatus(''); setSearch('') }}
            className="flex items-center gap-1 text-xs text-danger hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-danger hover:bg-opacity-10">
            <X className="w-3 h-3" />Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Auto-refresh 10s · Click card to view details
        </div>
      </div>

      {/* City summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {cityStats.map(({ city, available, busy, total }) => (
          <div key={city} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-accent hover:border-opacity-30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-accent bg-opacity-10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold capitalize">{city}</p>
              <p className="text-muted text-xs">
                <span className="text-success">{available}</span> avail
                <span className="mx-1">·</span>
                <span className="text-danger">{busy}</span> busy
                <span className="mx-1">·</span>
                {total} total
              </p>
            </div>
            <div className={`text-2xl font-bold ${available > 0 ? 'text-success' : 'text-danger'}`}>
              {available}
            </div>
          </div>
        ))}
      </div>

      {/* City sections */}
      {CITIES.map(city => (
        <CitySection
          key={city}
          city={city}
          filterStatus={filterStatus}
          search={search}
          onSelectResponder={setSelectedResp}
        />
      ))}
    </div>
  )
}