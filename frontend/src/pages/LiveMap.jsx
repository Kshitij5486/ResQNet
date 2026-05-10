import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ZoomIn, Layers } from 'lucide-react'
import api from '../api/axios'

const CITIES = ['mumbai', 'delhi', 'bangalore']

const CITY_VIEWS = {
  all:       { center: [20.5, 78.5], zoom: 5  },
  mumbai:    { center: [19.0760, 72.8777], zoom: 12 },
  delhi:     { center: [28.6139, 77.2090], zoom: 12 },
  bangalore: { center: [12.9716, 77.5946], zoom: 12 },
}

const TYPE_COLOR = {
  AMBULANCE: '#3b82f6',
  FIRE:      '#ef4444',
  POLICE:    '#f59e0b',
}

function spreadCoords(lat, lng, index, total) {
  if (total <= 1) return [lat, lng]
  const r     = 0.022
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return [lat + r * Math.cos(angle), lng + r * Math.sin(angle)]
}

function severityBar(n) {
  let s = ''
  for (let i = 0; i < 5; i++) {
    s += i < n
      ? '<span style="color:#ef4444;">&#9646;</span>'
      : '<span style="color:#1e2d45;">&#9646;</span>'
  }
  return s + ' ' + n + '/5'
}

function popupBase() {
  return `background:#0d1526;border:1px solid #1e2d45;border-radius:10px;padding:14px 16px;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;min-width:210px;box-shadow:0 8px 32px rgba(0,0,0,0.7);`
}

export default function LiveMap() {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef     = useRef([])
  const heatLayerRef   = useRef(null)
  const [activeCity,   setActiveCity]   = useState('all')
  const [showHeatmap,  setShowHeatmap]  = useState(false)
  const [showPins,     setShowPins]     = useState(true)

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
    queryKey: ['ai-heatmap'],
    queryFn:  () => api.get('/api/ai/analytics/heatmap').then(r => r.data),
    refetchInterval: 30000,
  })

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return
    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center: CITY_VIEWS.all.center,
      zoom:   CITY_VIEWS.all.zoom,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  // Heatmap layer
  useEffect(() => {
    const L   = window.L
    const map = mapInstanceRef.current
    if (!L || !map || !heatmapData?.points) return

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (!showHeatmap) return

    // Check if Leaflet.heat is available
    if (!L.heatLayer) {
      // Fallback: draw circle overlays
      const circles = heatmapData.points.map(p => {
        const color = p.type === 'FIRE' ? '#ef4444' : p.type === 'MEDICAL' ? '#3b82f6' : '#f59e0b'
        const circle = L.circle([p.lat, p.lng], {
          radius:      p.weight * 2000,
          color:       color,
          fillColor:   color,
          fillOpacity: p.weight * 0.35,
          opacity:     0.6,
          weight:      1,
        }).addTo(map)
        circle.bindPopup(`
          <div style="${popupBase()}">
            <div style="font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:8px;">
              AI Hotspot
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">
              City: <span style="color:#e2e8f0;font-weight:600;">${p.city.charAt(0).toUpperCase()+p.city.slice(1)}</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">
              Type: <span style="color:${color};font-weight:600;">${p.type}</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">
              Incidents: <span style="color:#e2e8f0;font-weight:600;">${p.incidents}</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">
              Risk Weight: <span style="color:#f59e0b;font-weight:600;">${(p.weight * 100).toFixed(0)}%</span>
            </div>
          </div>
        `, { className: 'custom-popup', maxWidth: 220 })
        return circle
      })
      heatLayerRef.current = L.layerGroup(circles)
      heatLayerRef.current.addTo(map)
      return
    }

    const heatPoints = heatmapData.points.map(p => [p.lat, p.lng, p.weight])
    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius:    35,
      blur:      25,
      maxZoom:   15,
      max:       1.0,
      gradient:  { 0.2: '#3b82f6', 0.5: '#f59e0b', 0.8: '#ef4444', 1.0: '#7f1d1d' },
    }).addTo(map)

  }, [showHeatmap, heatmapData])

  // Responder + incident markers
  useEffect(() => {
    const L   = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    if (!showPins) return

    // Group by city
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
        const typeLabel  = r.type === 'AMBULANCE' ? 'Ambulance' : r.type === 'FIRE' ? 'Fire Unit' : 'Police'
        const dotSpan    = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${dotColor};margin-right:5px;vertical-align:middle;"></span>`
        const statusColor = isAvail ? '#22c55e' : '#ef4444'

        const icon = L.divIcon({
          html: `<div style="width:36px;height:36px;background:${ringColor}20;border:2.5px solid ${ringColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px ${ringColor}50;">
            <div style="width:13px;height:13px;background:${dotColor};border-radius:50%;box-shadow:0 0 6px ${dotColor}99;"></div>
          </div>`,
          className: '', iconSize: [36,36], iconAnchor: [18,18],
        })

        const marker = L.marker([lat, lng], { icon }).addTo(map)
          .bindPopup(`<div style="${popupBase()}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1e2d45;">
              <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${r.name}</div>
              <div style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:999px;background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}40;">${r.status}</div>
            </div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;">${dotSpan}${typeLabel}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;"><span style="color:#475569;">Vehicle:</span> ${r.vehicleId||'N/A'}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;"><span style="color:#475569;">Phone:</span> ${r.phoneNumber||'N/A'}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;"><span style="color:#475569;">City:</span> ${r.city?.charAt(0).toUpperCase()+r.city?.slice(1)}</div>
            <div style="font-size:10px;color:#334155;margin-top:8px;padding-top:8px;border-top:1px solid #1e2d45;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            ${r.currentIncidentId ? `<div style="margin-top:8px;padding:6px 10px;background:#f59e0b10;border:1px solid #f59e0b30;border-radius:6px;font-size:10px;color:#f59e0b;">On Duty: ${r.currentIncidentId.slice(0,16)}...</div>` : ''}
          </div>`, { className:'custom-popup', maxWidth:250 })

        markersRef.current.push(marker)
      })
    })

    // Incident markers
    const byLocation = {}
    incidents.forEach(inc => {
      if (!inc.latitude || !inc.longitude) return
      const key = inc.latitude + ',' + inc.longitude
      if (!byLocation[key]) byLocation[key] = []
      byLocation[key].push(inc)
    })

    Object.entries(byLocation).forEach(([key, group]) => {
      group.forEach((inc, idx) => {
        const baseLat = parseFloat(key.split(',')[0])
        const baseLng = parseFloat(key.split(',')[1])
        const [lat, lng] = spreadCoords(baseLat + 0.01, baseLng + 0.01, idx, group.length)
        const color = inc.status === 'DISPATCHED' ? '#22c55e' : '#f59e0b'

        const icon = L.divIcon({
          html: `<div style="width:20px;height:20px;background:${color}20;border:2px solid ${color};border-radius:3px;transform:rotate(45deg);box-shadow:0 0 10px ${color}55;"></div>`,
          className: '', iconSize:[20,20], iconAnchor:[10,10],
        })

        const marker = L.marker([lat, lng], { icon }).addTo(map)
          .bindPopup(`<div style="${popupBase()}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1e2d45;">
              <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${inc.type} Incident</div>
              <div style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:999px;background:${color}15;color:${color};border:1px solid ${color}40;">${inc.status}</div>
            </div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;"><span style="color:#475569;">City:</span> ${inc.city?.charAt(0).toUpperCase()+inc.city?.slice(1)}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;"><span style="color:#475569;">Severity:</span> ${severityBar(inc.severity)}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;"><span style="color:#475569;">Description:</span> ${inc.description||'N/A'}</div>
            <div style="font-size:10px;color:#334155;margin-top:8px;padding-top:8px;border-top:1px solid #1e2d45;">${inc.latitude}, ${inc.longitude}</div>
          </div>`, { className:'custom-popup', maxWidth:250 })

        markersRef.current.push(marker)
      })
    })

    if (markersRef.current.length > 0) {
      try {
        const group = L.featureGroup(markersRef.current)
        map.fitBounds(group.getBounds().pad(0.15))
      } catch(e) {}
    }

  }, [allResponders, incidents, showPins])

  // City fly
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const v = CITY_VIEWS[activeCity]
    map.flyTo(v.center, v.zoom, { duration: 1.0 })
  }, [activeCity])

  const available  = allResponders.filter(r => r.status === 'AVAILABLE').length
  const busy       = allResponders.filter(r => r.status === 'BUSY').length
  const dispatched = incidents.filter(i => i.status === 'DISPATCHED').length
  const reported   = incidents.filter(i => i.status === 'REPORTED').length
  const hotspots   = heatmapData?.points?.length ?? 0
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 104px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Live Map</h1>
          <p className="text-muted text-xs mt-0.5">Real-time positions · Last updated {lastUpdate}</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white text-sm transition-all hover:border-accent hover:border-opacity-40">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        {[
          { label:'Available',  value:available,  color:'text-success', bg:'bg-success' },
          { label:'Busy',       value:busy,        color:'text-danger',  bg:'bg-danger'  },
          { label:'Dispatched', value:dispatched,  color:'text-success', bg:'bg-success' },
          { label:'Reported',   value:reported,    color:'text-warning', bg:'bg-warning' },
          { label:'AI Hotspots',value:hotspots,    color:'text-accent',  bg:'bg-accent'  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} bg-opacity-10 flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${bg} animate-pulse`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs text-muted mr-1">Jump to:</span>
          {['all','mumbai','delhi','bangalore'].map(c => (
            <button key={c} onClick={() => setActiveCity(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                activeCity === c
                  ? 'bg-accent bg-opacity-20 text-accent border border-accent border-opacity-30'
                  : 'bg-subtle text-muted hover:text-white border border-border'
              }`}>{c === 'all' ? 'All India' : c}</button>
          ))}
        </div>

        {/* Layer toggles */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs text-muted">Layers:</span>
          <button onClick={() => setShowPins(!showPins)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
              showPins
                ? 'bg-accent bg-opacity-20 text-accent border-accent border-opacity-30'
                : 'bg-subtle text-muted border-border hover:text-white'
            }`}>Responders</button>
          <button onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border flex items-center gap-1 ${
              showHeatmap
                ? 'bg-danger bg-opacity-20 text-danger border-danger border-opacity-30'
                : 'bg-subtle text-muted border-border hover:text-white'
            }`}>
            🔥 AI Heatmap {showHeatmap ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {[
            { color:'#22c55e', shape:'circle',  label:'Available' },
            { color:'#ef4444', shape:'circle',  label:'Busy'      },
            { color:'#22c55e', shape:'diamond', label:'Dispatched'},
            { color:'#f59e0b', shape:'diamond', label:'Reported'  },
            { color:'#ef4444', shape:'heat',    label:'Hotspot'   },
          ].map(({ color, shape, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {shape === 'circle'
                ? <div style={{ width:12, height:12, borderRadius:'50%', border:`2px solid ${color}`, background:`${color}20` }} />
                : shape === 'diamond'
                ? <div style={{ width:10, height:10, border:`2px solid ${color}`, background:`${color}20`, transform:'rotate(45deg)' }} />
                : <div style={{ width:12, height:12, borderRadius:'50%', background:`radial-gradient(${color}, #f59e0b20)`, opacity:0.8 }} />
              }
              <span className="text-xs text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-border min-h-0">
        {showHeatmap && (
          <div className="absolute top-3 left-3 z-10 bg-card border border-danger border-opacity-30 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-xs text-danger font-medium">AI Heatmap Active · {hotspots} hotspots</span>
          </div>
        )}
        <div ref={mapRef} style={{ height:'100%', width:'100%' }} />
      </div>
    </div>
  )
}