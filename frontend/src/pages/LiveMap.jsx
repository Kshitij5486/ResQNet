import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  RefreshCw, Layers, MapPin, Users, AlertTriangle,
  Zap, Radio, ChevronRight, Flame, Heart, Shield,
  CloudLightning, Eye, EyeOff, Navigation
} from 'lucide-react'
import api from '../api/axios'

const CITIES = ['mumbai', 'delhi', 'bangalore']

const CITY_VIEWS = {
  all:       { center: [20.5937, 78.9629], zoom: 5  },
  mumbai:    { center: [19.0760, 72.8777], zoom: 12 },
  delhi:     { center: [28.6139, 77.2090], zoom: 12 },
  bangalore: { center: [12.9716, 77.5946], zoom: 12 },
}

const TYPE_COLOR = {
  AMBULANCE: '#3b82f6',
  FIRE:      '#ef4444',
  POLICE:    '#f59e0b',
}

const TYPE_ICON = {
  AMBULANCE: '🚑',
  FIRE:      '🚒',
  POLICE:    '🚓',
}

const INC_TYPE_COLOR = {
  FIRE:     '#ef4444',
  MEDICAL:  '#3b82f6',
  POLICE:   '#f59e0b',
  DISASTER: '#8b5cf6',
}

function spreadCoords(lat, lng, index, total) {
  if (total <= 1) return [lat, lng]
  const r     = 0.018
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return [lat + r * Math.cos(angle), lng + r * Math.sin(angle)]
}

function popupStyle() {
  return `background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px 16px;color:#e2e8f0;font-family:system-ui,sans-serif;min-width:200px;box-shadow:0 20px 60px rgba(0,0,0,0.8);`
}

export default function LiveMap() {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef     = useRef([])
  const heatLayerRef   = useRef(null)
  const [activeCity,  setActiveCity]  = useState('all')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showPins,    setShowPins]    = useState(true)
  const [showInc,     setShowInc]     = useState(true)
  const [mapReady,    setMapReady]    = useState(false)

  const { data: allResponders = [], refetch, dataUpdatedAt } = useQuery({
    queryKey: ['map-responders'],
    queryFn: async () => {
      const results = await Promise.all(
        CITIES.map(c => api.get('/api/responders?city=' + c).then(r => r.data))
      )
      return results.flat()
    },
    refetchInterval: 10000,
  })

  const { data: incidents = [] } = useQuery({
    queryKey: ['map-incidents'],
    queryFn:  () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: heatmapData } = useQuery({
    queryKey: ['map-heatmap'],
    queryFn:  () => api.get('/api/ai/analytics/heatmap').then(r => r.data),
    refetchInterval: 30000,
  })

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return
    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center:      CITY_VIEWS.all.center,
      zoom:        CITY_VIEWS.all.zoom,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains:  'abcd',
      maxZoom:     19,
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  // Heatmap
  useEffect(() => {
    const L   = window.L
    const map = mapInstanceRef.current
    if (!L || !map || !heatmapData?.points) return

    if (heatLayerRef.current) {
      try { map.removeLayer(heatLayerRef.current) } catch(e) {}
      heatLayerRef.current = null
    }

    if (!showHeatmap) return

    const circles = heatmapData.points.map(p => {
      const color  = INC_TYPE_COLOR[p.type] || '#3b82f6'
      const circle = L.circle([p.lat, p.lng], {
        radius:      p.weight * 2500,
        color,
        fillColor:   color,
        fillOpacity: p.weight * 0.25,
        opacity:     0.5,
        weight:      1,
      }).addTo(map)
      circle.bindPopup(`
        <div style="${popupStyle()}">
          <div style="font-size:12px;font-weight:700;color:#f1f5f9;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
            AI Hotspot · ${p.city.charAt(0).toUpperCase()+p.city.slice(1)}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div style="background:#1e293b;border-radius:8px;padding:8px;">
              <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Type</div>
              <div style="font-size:12px;font-weight:600;color:${color};">${p.type}</div>
            </div>
            <div style="background:#1e293b;border-radius:8px;padding:8px;">
              <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Risk</div>
              <div style="font-size:12px;font-weight:600;color:#f59e0b;">${(p.weight*100).toFixed(0)}%</div>
            </div>
            <div style="background:#1e293b;border-radius:8px;padding:8px;">
              <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Incidents</div>
              <div style="font-size:12px;font-weight:600;color:#e2e8f0;">${p.incidents}</div>
            </div>
          </div>
        </div>
      `, { className:'custom-popup', maxWidth:240 })
      return circle
    })
    heatLayerRef.current = L.layerGroup(circles).addTo(map)
  }, [showHeatmap, heatmapData])

  // Markers
  useEffect(() => {
    const L   = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => { try { map.removeLayer(m) } catch(e) {} })
    markersRef.current = []

    // Responder markers
    if (showPins) {
      const byCity = {}
      allResponders.forEach(r => {
        if (!byCity[r.city]) byCity[r.city] = []
        byCity[r.city].push(r)
      })

      Object.entries(byCity).forEach(([city, group]) => {
        group.forEach((r, idx) => {
          const [lat, lng] = spreadCoords(r.latitude, r.longitude, idx, group.length)
          const isAvail    = r.status === 'AVAILABLE'
          const ringColor  = isAvail ? '#22c55e' : '#ef4444'
          const dotColor   = TYPE_COLOR[r.type] || '#94a3b8'
          const emoji      = TYPE_ICON[r.type]  || '🚨'

          const icon = L.divIcon({
            html: `
              <div style="position:relative;width:40px;height:40px;">
                <div style="position:absolute;inset:0;border-radius:50%;background:${ringColor}15;border:2px solid ${ringColor};box-shadow:0 0 12px ${ringColor}40;display:flex;align-items:center;justify-content:center;">
                  <div style="width:14px;height:14px;border-radius:50%;background:${dotColor};box-shadow:0 0 8px ${dotColor}99;"></div>
                </div>
                ${isAvail ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${ringColor};animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;opacity:0.4;"></div>` : ''}
              </div>`,
            className: '', iconSize:[40,40], iconAnchor:[20,20],
          })

          const marker = L.marker([lat, lng], { icon }).addTo(map)
          marker.bindPopup(`
            <div style="${popupStyle()}">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
                <div style="width:36px;height:36px;border-radius:10px;background:${dotColor}20;border:1px solid ${dotColor}40;display:flex;align-items:center;justify-content:center;font-size:16px;">${emoji}</div>
                <div>
                  <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${r.name}</div>
                  <div style="font-size:11px;color:#64748b;">${r.type} · ${r.city?.charAt(0).toUpperCase()+r.city?.slice(1)}</div>
                </div>
                <div style="margin-left:auto;padding:3px 8px;border-radius:999px;background:${isAvail?'#22c55e':'#ef4444'}15;border:1px solid ${isAvail?'#22c55e':'#ef4444'}40;font-size:10px;font-weight:700;color:${isAvail?'#22c55e':'#ef4444'};">${isAvail?'AVAILABLE':'ON DUTY'}</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <div style="background:#1e293b;border-radius:8px;padding:8px;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Vehicle</div>
                  <div style="font-size:11px;font-weight:600;color:#e2e8f0;">${r.vehicleId||'N/A'}</div>
                </div>
                <div style="background:#1e293b;border-radius:8px;padding:8px;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Phone</div>
                  <div style="font-size:11px;font-weight:600;color:#e2e8f0;">${r.phoneNumber||'N/A'}</div>
                </div>
              </div>
              <div style="margin-top:6px;background:#1e293b;border-radius:8px;padding:8px;">
                <div style="font-size:10px;color:#64748b;margin-bottom:2px;">GPS</div>
                <div style="font-size:11px;font-mono;color:#94a3b8;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
              </div>
              ${r.currentIncidentId ? `<div style="margin-top:6px;padding:8px;background:#ef444410;border:1px solid #ef444430;border-radius:8px;font-size:10px;color:#ef4444;font-weight:600;">🚨 Active incident assigned</div>` : ''}
            </div>
          `, { className:'custom-popup', maxWidth:260 })

          markersRef.current.push(marker)
        })
      })
    }

    // Incident markers
    if (showInc) {
      const incList = Array.isArray(incidents) ? incidents : []
      const byLoc   = {}
      incList.forEach(inc => {
        if (!inc.latitude || !inc.longitude) return
        const key = `${inc.latitude},${inc.longitude}`
        if (!byLoc[key]) byLoc[key] = []
        byLoc[key].push(inc)
      })

      Object.entries(byLoc).forEach(([key, group]) => {
        group.forEach((inc, idx) => {
          const [baseLat, baseLng] = key.split(',').map(Number)
          const [lat, lng] = spreadCoords(baseLat + 0.008, baseLng + 0.008, idx, group.length)
          const color  = INC_TYPE_COLOR[inc.type] || '#f59e0b'
          const isDisp = inc.status === 'DISPATCHED'

          const icon = L.divIcon({
            html: `
              <div style="width:22px;height:22px;background:${color}20;border:2px solid ${color};border-radius:4px;transform:rotate(45deg);box-shadow:0 0 12px ${color}55;display:flex;align-items:center;justify-content:center;">
              </div>`,
            className: '', iconSize:[22,22], iconAnchor:[11,11],
          })

          const marker = L.marker([lat, lng], { icon }).addTo(map)
          marker.bindPopup(`
            <div style="${popupStyle()}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1e293b;">
                <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${inc.type} Incident</div>
                <div style="padding:3px 8px;border-radius:999px;background:${isDisp?'#22c55e':'#f59e0b'}15;border:1px solid ${isDisp?'#22c55e':'#f59e0b'}40;font-size:10px;font-weight:700;color:${isDisp?'#22c55e':'#f59e0b'};">${inc.status}</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <div style="background:#1e293b;border-radius:8px;padding:8px;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:2px;">City</div>
                  <div style="font-size:11px;font-weight:600;color:#e2e8f0;text-transform:capitalize;">${inc.city}</div>
                </div>
                <div style="background:#1e293b;border-radius:8px;padding:8px;">
                  <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Severity</div>
                  <div style="font-size:11px;font-weight:600;color:#ef4444;">${inc.severity}/5</div>
                </div>
              </div>
              ${inc.description ? `<div style="margin-top:6px;background:#1e293b;border-radius:8px;padding:8px;font-size:11px;color:#94a3b8;">${inc.description}</div>` : ''}
            </div>
          `, { className:'custom-popup', maxWidth:240 })

          markersRef.current.push(marker)
        })
      })
    }

    if (markersRef.current.length > 0) {
      try {
        const group = L.featureGroup(markersRef.current)
        map.fitBounds(group.getBounds().pad(0.15))
      } catch(e) {}
    }
  }, [allResponders, incidents, showPins, showInc])

  // City fly
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const v = CITY_VIEWS[activeCity]
    map.flyTo(v.center, v.zoom, { duration: 1.2 })
  }, [activeCity])

  const available  = allResponders.filter(r => r.status === 'AVAILABLE').length
  const busy       = allResponders.filter(r => r.status === 'BUSY').length
  const incList    = Array.isArray(incidents) ? incidents : []
  const dispatched = incList.filter(i => i.status === 'DISPATCHED').length
  const reported   = incList.filter(i => i.status === 'REPORTED').length
  const hotspots   = heatmapData?.points?.length ?? 0
  const lastSync   = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  return (
    <div className="flex flex-col gap-4" style={{ height:'calc(100vh - 104px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Tactical Map</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time GPS tracking · AI heatmap overlay · Last updated {lastSync}</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-all hover:border-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        {[
          { label:'Available',   value:available,  color:'text-green-400',  bg:'bg-green-500',  icon:Users         },
          { label:'On Duty',     value:busy,        color:'text-red-400',    bg:'bg-red-500',    icon:Radio         },
          { label:'Dispatched',  value:dispatched,  color:'text-green-400',  bg:'bg-green-500',  icon:Zap           },
          { label:'Reported',    value:reported,    color:'text-yellow-400', bg:'bg-yellow-500', icon:AlertTriangle },
          { label:'AI Hotspots', value:hotspots,    color:'text-purple-400', bg:'bg-purple-500', icon:Flame         },
        ].map(({ label, value, color, bg, icon:Icon }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-shrink-0 gap-4">
        {/* City jump */}
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Jump to:</span>
          {['all','mumbai','delhi','bangalore'].map(c => (
            <button key={c} onClick={() => setActiveCity(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                activeCity === c
                  ? 'bg-blue-600 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-40'
                  : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-700 hover:border-slate-500'
              }`}>{c === 'all' ? 'All India' : c}</button>
          ))}
        </div>

        {/* Layer toggles */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Layers:</span>
          <button onClick={() => setShowPins(!showPins)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showPins
                ? 'bg-blue-600 bg-opacity-20 text-blue-400 border-blue-500 border-opacity-40'
                : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'
            }`}>
            {showPins ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Responders
          </button>
          <button onClick={() => setShowInc(!showInc)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showInc
                ? 'bg-amber-500 bg-opacity-20 text-amber-400 border-amber-500 border-opacity-40'
                : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'
            }`}>
            {showInc ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Incidents
          </button>
          <button onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showHeatmap
                ? 'bg-red-500 bg-opacity-20 text-red-400 border-red-500 border-opacity-40'
                : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'
            }`}>
            <Flame className="w-3 h-3" />
            AI Heatmap {showHeatmap ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {[
            { color:'#22c55e', shape:'circle',  label:'Available'  },
            { color:'#ef4444', shape:'circle',  label:'On Duty'    },
            { color:'#f59e0b', shape:'diamond', label:'Incident'   },
            { color:'#8b5cf6', shape:'heat',    label:'AI Hotspot' },
          ].map(({ color, shape, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {shape === 'circle'
                ? <div style={{ width:10, height:10, borderRadius:'50%', border:`2px solid ${color}`, background:`${color}15` }} />
                : shape === 'diamond'
                ? <div style={{ width:10, height:10, border:`2px solid ${color}`, background:`${color}15`, transform:'rotate(45deg)' }} />
                : <div style={{ width:10, height:10, borderRadius:'50%', background:color, opacity:0.7 }} />
              }
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-800 min-h-0">
        {showHeatmap && (
          <div className="absolute top-3 left-3 z-10 bg-slate-900 border border-red-500 border-opacity-40 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs text-red-400 font-bold">AI Heatmap Active · {hotspots} hotspots</span>
          </div>
        )}
        {!mapReady && (
          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading tactical map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height:'100%', width:'100%' }} />
      </div>
    </div>
  )
}