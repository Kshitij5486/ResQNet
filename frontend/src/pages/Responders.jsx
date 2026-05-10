import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users, MapPin, Phone, Car, X, Search,
  Radio, Zap, Heart, Shield, Flame, Filter,
  ChevronRight, Activity, RefreshCw, AlertCircle
} from 'lucide-react'
import api from '../api/axios'

const TYPE_CONFIG = {
  AMBULANCE: { icon: Heart,  color: '#3b82f6', bg: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500',   label: 'Ambulance' },
  FIRE:      { icon: Flame,  color: '#ef4444', bg: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500',    label: 'Fire Unit' },
  POLICE:    { icon: Shield, color: '#f59e0b', bg: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-500',  label: 'Police'    },
}

const STATUS_CONFIG = {
  AVAILABLE: { color: 'text-green-400',  bg: 'bg-green-500',  dot: 'bg-green-400',  border: 'border-green-500',  label: 'Available' },
  BUSY:      { color: 'text-red-400',    bg: 'bg-red-500',    dot: 'bg-red-400',    border: 'border-red-500',    label: 'On Duty'   },
  OFFLINE:   { color: 'text-slate-400',  bg: 'bg-slate-500',  dot: 'bg-slate-400',  border: 'border-slate-500',  label: 'Offline'   },
}

const CITIES = ['mumbai','delhi','bangalore']

function DetailModal({ responder, onClose }) {
  const tc = TYPE_CONFIG[responder.type]     || { icon: Radio, color:'#64748b', label: responder.type }
  const sc = STATUS_CONFIG[responder.status] || STATUS_CONFIG.OFFLINE
  const Icon = tc.icon
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:tc.color+'20',border:`1px solid ${tc.color}40`}}>
              <Icon className="w-6 h-6" style={{color:tc.color}}/>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{responder.name}</h2>
              <p className="text-slate-500 text-xs">{tc.label} · {responder.city?.charAt(0).toUpperCase()+responder.city?.slice(1)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sc.color} bg-slate-800 border ${sc.border} border-opacity-30`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${responder.status==='AVAILABLE'?'animate-pulse':''}`}/>
              {sc.label}
            </div>
            <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              {label:'Vehicle ID', value:responder.vehicleId||'N/A',    icon:Car   },
              {label:'Phone',      value:responder.phoneNumber||'N/A',  icon:Phone },
              {label:'City',       value:responder.city?.charAt(0).toUpperCase()+responder.city?.slice(1), icon:MapPin},
              {label:'Unit Type',  value:tc.label,                      icon:Radio },
            ].map(({label,value,icon:I}) => (
              <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <I className="w-3.5 h-3.5 text-slate-500"/>
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{label}</span>
                </div>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-slate-500"/>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">GPS Position</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><p className="text-xs text-slate-600 mb-1">Latitude</p><p className="text-white font-mono text-sm">{responder.latitude}</p></div>
              <div><p className="text-xs text-slate-600 mb-1">Longitude</p><p className="text-white font-mono text-sm">{responder.longitude}</p></div>
            </div>
            <div className="h-20 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{background:tc.color}}/>
                <p className="text-xs font-mono text-slate-500">{responder.latitude?.toFixed(4)}, {responder.longitude?.toFixed(4)}</p>
              </div>
            </div>
          </div>

          {responder.currentIncidentId && (
            <div className="bg-red-500 bg-opacity-5 border border-red-500 border-opacity-20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-400"/>
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Active Incident</span>
              </div>
              <p className="text-xs font-mono text-slate-400 break-all">{responder.currentIncidentId}</p>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Unit ID</p>
            <p className="text-xs font-mono text-slate-400 break-all">{responder.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResponderCard({ responder, onClick }) {
  const tc = TYPE_CONFIG[responder.type]     || { icon:Radio, color:'#64748b', label:responder.type, bg:'bg-slate-500', text:'text-slate-400', border:'border-slate-500' }
  const sc = STATUS_CONFIG[responder.status] || STATUS_CONFIG.OFFLINE
  const Icon = tc.icon
  const isAvail = responder.status === 'AVAILABLE'
  return (
    <div onClick={onClick}
      className={`bg-slate-900 border rounded-xl p-5 cursor-pointer hover:border-opacity-50 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden ${
        isAvail ? 'border-slate-700 hover:border-green-500' : 'border-slate-800 hover:border-red-500'
      }`}>
      <div className={`absolute top-0 left-0 w-0.5 h-full ${isAvail ? 'bg-green-500' : 'bg-red-500'} opacity-60`}/>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:tc.color+'18',border:`1px solid ${tc.color}33`}}>
            <Icon className="w-5 h-5" style={{color:tc.color}}/>
          </div>
          <div>
            <p className="text-white font-semibold text-sm group-hover:text-white transition-colors">{responder.name}</p>
            <p className="text-slate-500 text-xs">{tc.label}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${sc.color} bg-slate-800 border ${sc.border} border-opacity-20`}>
          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${isAvail?'animate-pulse':''}`}/>
          {sc.label}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0"/>
          <span className="text-xs text-slate-400 capitalize">{responder.city}</span>
          <span className="text-slate-700 text-xs">·</span>
          <span className="text-xs font-mono text-slate-600">{responder.latitude?.toFixed(3)}, {responder.longitude?.toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Car className="w-3 h-3 text-slate-600 flex-shrink-0"/>
          <span className="text-xs text-slate-400">{responder.vehicleId||'—'}</span>
          <span className="text-slate-700 text-xs">·</span>
          <Phone className="w-3 h-3 text-slate-600"/>
          <span className="text-xs text-slate-400">{responder.phoneNumber||'—'}</span>
        </div>
        {responder.currentIncidentId && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
            <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0"/>
            <span className="text-xs text-red-400 font-medium truncate">Incident: {responder.currentIncidentId?.slice(0,16)}...</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-600">View details</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"/>
      </div>
    </div>
  )
}

export default function Responders() {
  const [selected,    setSelected]    = useState(null)
  const [filterCity,  setFilterCity]  = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [filterStatus,setFilterStatus]= useState('')
  const [search,      setSearch]      = useState('')
  const [view,        setView]        = useState('grid')

  const { data:allResponders=[], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['responders-all'],
    queryFn: async () => {
      const results = await Promise.all(
        CITIES.map(c => api.get('/api/responders?city='+c).then(r=>r.data))
      )
      return results.flat()
    },
    refetchInterval: 10000,
  })

  const filtered = allResponders
    .filter(r => {
      if (filterCity   && r.city   !== filterCity)   return false
      if (filterType   && r.type   !== filterType)   return false
      if (filterStatus && r.status !== filterStatus)  return false
      if (search) {
        const q = search.toLowerCase()
        return r.name?.toLowerCase().includes(q) || r.vehicleId?.toLowerCase().includes(q) ||
               r.city?.toLowerCase().includes(q) || r.type?.toLowerCase().includes(q)
      }
      return true
    })

  const available  = allResponders.filter(r=>r.status==='AVAILABLE').length
  const busy       = allResponders.filter(r=>r.status==='BUSY').length
  const byCity     = CITIES.map(c => ({
    city: c,
    total:     allResponders.filter(r=>r.city===c).length,
    available: allResponders.filter(r=>r.city===c&&r.status==='AVAILABLE').length,
  }))
  const lastSync = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  const TYPES = [...new Set(allResponders.map(r=>r.type))].filter(Boolean)

  return (
    <div className="space-y-5">
      {selected && <DetailModal responder={selected} onClose={()=>setSelected(null)}/>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Responder Units</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            <span className="text-white font-medium">{allResponders.length}</span> total ·
            <span className="text-green-400 ml-1 font-medium">{available} available</span> ·
            <span className="text-red-400 ml-1 font-medium">{busy} on duty</span>
            <span className="text-slate-600 ml-2">· synced {lastSync}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden">
            {['grid','list'].map(v => (
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${v===view?'bg-slate-700 text-white':'text-slate-500 hover:text-white'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={()=>refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-all hover:border-slate-500">
            <RefreshCw className="w-3.5 h-3.5"/>Refresh
          </button>
        </div>
      </div>

      {/* City stats */}
      <div className="grid grid-cols-3 gap-4">
        {byCity.map(({city,total,available:av}) => {
          const pct = total>0 ? Math.round((av/total)*100) : 0
          const color = pct>60?'text-green-400':pct>30?'text-yellow-400':'text-red-400'
          const bar   = pct>60?'bg-green-500':pct>30?'bg-yellow-500':'bg-red-500'
          return (
            <div key={city} onClick={()=>setFilterCity(filterCity===city?'':city)}
              className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${
                filterCity===city ? 'border-blue-500 border-opacity-50' : 'border-slate-800 hover:border-slate-600'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-slate-500"/>
                  <span className="text-sm font-bold text-white capitalize">{city}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{av}/{total}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{width:pct+'%'}}/>
              </div>
              <p className="text-xs text-slate-600">{pct}% available · click to filter</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, vehicle..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"/>
        </div>
        <Filter className="w-3.5 h-3.5 text-slate-600"/>
        {[
          {value:filterStatus, set:setFilterStatus, opts:['AVAILABLE','BUSY'], ph:'All Status'},
          {value:filterType,   set:setFilterType,   opts:TYPES,                ph:'All Types' },
        ].map(({value,set,opts,ph},i) => (
          <select key={i} value={value} onChange={e=>set(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors">
            <option value="">{ph}</option>
            {opts.map(o=><option key={o} value={o}>{o.charAt(0)+o.slice(1).toLowerCase()}</option>)}
          </select>
        ))}
        {(filterCity||filterStatus||filterType||search) && (
          <button onClick={()=>{setFilterCity('');setFilterStatus('');setFilterType('');setSearch('')}}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-500 hover:bg-opacity-10 transition-all">
            <X className="w-3 h-3"/>Clear filters
          </button>
        )}
        <div className="ml-auto text-xs text-slate-600 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          {filtered.length} unit{filtered.length!==1?'s':''}
        </div>
      </div>

      {/* Grid / List view */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-44 bg-slate-900 rounded-xl animate-pulse border border-slate-800"/>)}
        </div>
      ) : filtered.length===0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
          <Users className="w-8 h-8 text-slate-700 mx-auto mb-3"/>
          <p className="text-white font-medium text-sm mb-1">No responders found</p>
          <p className="text-slate-600 text-xs">Try adjusting your filters</p>
        </div>
      ) : view==='grid' ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(r => <ResponderCard key={r.id} responder={r} onClick={()=>setSelected(r)}/>)}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-black bg-opacity-30">
                {['Unit','Type','City','Vehicle','Phone','Status',''].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const tc = TYPE_CONFIG[r.type]     || {icon:Radio,color:'#64748b',label:r.type}
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.OFFLINE
                const Icon = tc.icon
                return (
                  <tr key={r.id} onClick={()=>setSelected(r)}
                    className="border-b border-slate-800 hover:bg-slate-800 hover:bg-opacity-40 cursor-pointer group transition-all">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:tc.color+'18'}}>
                          <Icon className="w-4 h-4" style={{color:tc.color}}/>
                        </div>
                        <span className="text-sm font-medium text-white">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{background:tc.color+'20',color:tc.color}}>{tc.label}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm text-slate-300 capitalize">{r.city}</span></td>
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-400">{r.vehicleId||'—'}</span></td>
                    <td className="px-5 py-3.5"><span className="text-xs text-slate-400">{r.phoneNumber||'—'}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${r.status==='AVAILABLE'?'animate-pulse':''}`}/>
                        <span className={`text-xs font-bold ${sc.color}`}>{sc.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors"/>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-slate-800 bg-black bg-opacity-20">
            <p className="text-xs text-slate-600">{filtered.length} unit{filtered.length!==1?'s':''} · Click row to view details</p>
          </div>
        </div>
      )}
    </div>
  )
}