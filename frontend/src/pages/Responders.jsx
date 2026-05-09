import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, MapPin, Phone, Car, Filter, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import api from '../api/axios'

const CITIES = ['mumbai', 'delhi', 'bangalore']
const CITY_TOTAL = { mumbai: 5, delhi: 8, bangalore: 8 }

const TYPE_COLORS = {
  AMBULANCE: { text: 'text-accent',  bg: 'bg-accent',  label: 'Ambulance' },
  FIRE:      { text: 'text-danger',  bg: 'bg-danger',  label: 'Fire'      },
  POLICE:    { text: 'text-warning', bg: 'bg-warning', label: 'Police'    },
}

function ResponderCard({ responder }) {
  const type    = TYPE_COLORS[responder.type] || { text: 'text-muted', bg: 'bg-muted', label: responder.type }
  const isAvail = responder.status === 'AVAILABLE'
  return (
    <div className={`bg-card border rounded-xl p-4 transition-all ${
      isAvail ? 'border-border hover:border-success hover:border-opacity-50' : 'border-danger border-opacity-20 hover:border-opacity-50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg ${type.bg} bg-opacity-10 flex items-center justify-center`}>
            <Users className={`w-4 h-4 ${type.text}`} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">{responder.name}</p>
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
            <Car className="w-3.5 h-3.5" /><span>{responder.vehicleId}</span>
          </div>
        )}
        {responder.phoneNumber && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Phone className="w-3.5 h-3.5" /><span>{responder.phoneNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted">
          <MapPin className="w-3.5 h-3.5" />
          <span>{responder.latitude?.toFixed(4)}, {responder.longitude?.toFixed(4)}</span>
        </div>
        {responder.currentIncidentId && (
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span className="text-xs font-mono text-warning">{responder.currentIncidentId?.slice(0, 12)}...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CitySection({ city, filterStatus }) {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ['responders-all', city],
    queryFn: () => api.get(`/api/responders?city=${city}`).then(r => r.data),
    refetchInterval: 10000,
  })

  const available = all.filter(r => r.status === 'AVAILABLE')
  const busy      = all.filter(r => r.status === 'BUSY')
  const displayed = filterStatus === 'AVAILABLE' ? available
    : filterStatus === 'BUSY' ? busy : all

  const pct = all.length > 0 ? Math.round((available.length / all.length) * 100) : 0

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-accent" />
          <h2 className="text-base font-bold text-white capitalize">{city}</h2>
          <span className="text-xs text-muted">{available.length} available · {busy.length} busy · {all.length} total</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-subtle rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-warning' : 'bg-danger'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted">{pct}% available</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted text-sm">No {filterStatus?.toLowerCase() || ''} responders in {city}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {displayed.map(r => <ResponderCard key={r.id} responder={r} />)}
        </div>
      )}
    </div>
  )
}

export default function Responders() {
  const [filterStatus, setFilterStatus] = useState('')

  const cityStats = CITIES.map(city => {
    const { data: all = [] } = useQuery({
      queryKey: ['responders-all', city],
      queryFn: () => api.get(`/api/responders?city=${city}`).then(r => r.data),
      refetchInterval: 10000,
    })
    return {
      city,
      available: all.filter(r => r.status === 'AVAILABLE').length,
      busy: all.filter(r => r.status === 'BUSY').length,
      total: all.length,
    }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Responders</h1>
          <p className="text-muted text-sm mt-0.5">Real-time responder availability across all cities</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="BUSY">Busy Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cityStats.map(({ city, available, busy, total }) => (
          <div key={city} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent bg-opacity-10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold capitalize">{city}</p>
              <p className="text-muted text-xs">{available} available · {busy} busy · {total} total</p>
            </div>
            <div className={`text-lg font-bold ${available > 0 ? 'text-success' : 'text-danger'}`}>
              {available}
            </div>
          </div>
        ))}
      </div>

      {CITIES.map(city => (
        <CitySection key={city} city={city} filterStatus={filterStatus} />
      ))}
    </div>
  )
}