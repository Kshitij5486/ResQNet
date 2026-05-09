import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, ZoomIn } from 'lucide-react'
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

function popupStyle() {
  return `
    background:#0d1526;
    border:1px solid #1e2d45;
    border-radius:10px;
    padding:14px 16px;
    color:#e2e8f0;
    font-family:Inter,system-ui,sans-serif;
    min-width:210px;
    box-shadow:0 8px 32px rgba(0,0,0,0.7);
  `
}

function headerStyle(color) {
  return `
    display:flex;align-items:center;justify-content:space-between;
    margin-bottom:10px;padding-bottom:10px;
    border-bottom:1px solid #1e2d45;
  `
}

function badgeStyle(color) {
  return `
    font-size:10px;font-weight:600;
    padding:3px 8px;border-radius:999px;
    background:${color}18;color:${color};
    border:1px solid ${color}45;
  `
}

function rowStyle() {
  return 'font-size:11px;color:#64748b;margin-bottom:5px;'
}

function labelStyle() {
  return 'color:#94a3b8;'
}

export default function LiveMap() {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef     = useRef([])
  const [activeCity, setActiveCity] = useState('all')

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
    queryFn: () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 10000,
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
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  // Place markers
  useEffect(() => {
    const L   = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    // Group by city then spread
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

        const icon = L.divIcon({
          html: `
            <div style="
              width:38px;height:38px;
              background:${ringColor}18;
              border:2.5px solid ${ringColor};
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 0 12px ${ringColor}55, 0 2px 8px rgba(0,0,0,0.5);
            ">
              <div style="
                width:14px;height:14px;
                background:${dotColor};
                border-radius:50%;
                box-shadow:0 0 6px ${dotColor}99;
              "></div>
            </div>`,
          className: '',
          iconSize:   [38, 38],
          iconAnchor: [19, 19],
        })

        const statusColor = isAvail ? '#22c55e' : '#ef4444'
        const dotSpan     = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${dotColor};margin-right:5px;vertical-align:middle;"></span>`

        const popup = `
          <div style="${popupStyle()}">
            <div style="${headerStyle()}">
              <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${r.name}</div>
              <div style="${badgeStyle(statusColor)}">${r.status}</div>
            </div>
            <div style="${rowStyle()}">${dotSpan}<span style="${labelStyle()}">${typeLabel}</span></div>
            <div style="${rowStyle()}"><span style="${labelStyle()}">Vehicle:&nbsp;</span>${r.vehicleId || 'N/A'}</div>
            <div style="${rowStyle()}"><span style="${labelStyle()}">Phone:&nbsp;</span>${r.phoneNumber || 'N/A'}</div>
            <div style="${rowStyle()}"><span style="${labelStyle()}">City:&nbsp;</span>${r.city.charAt(0).toUpperCase() + r.city.slice(1)}</div>
            <div style="font-size:10px;color:#334155;margin-top:8px;padding-top:8px;border-top:1px solid #1e2d45;">
              ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </div>
            ${r.currentIncidentId ? `
            <div style="margin-top:8px;padding:6px 10px;background:#f59e0b10;border:1px solid #f59e0b30;border-radius:6px;font-size:10px;color:#f59e0b;">
              On Duty: ${r.currentIncidentId.slice(0, 16)}...
            </div>` : ''}
          </div>`

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(popup, { className: 'custom-popup', maxWidth: 260 })

        markersRef.current.push(marker)
      })
    })

    // Incident markers - group by location
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
          html: `
            <div style="
              width:20px;height:20px;
              background:${color}20;
              border:2px solid ${color};
              border-radius:3px;
              transform:rotate(45deg);
              box-shadow:0 0 10px ${color}55;
            "></div>`,
          className: '',
          iconSize:   [20, 20],
          iconAnchor: [10, 10],
        })

        const popup = `
          <div style="${popupStyle()}">
            <div style="${headerStyle()}">
              <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${inc.type} Incident</div>
              <div style="${badgeStyle(color)}">${inc.status}</div>
            </div>
            <div style="${rowStyle()}"><span style="${labelStyle()}">City:&nbsp;</span>${inc.city.charAt(0).toUpperCase() + inc.city.slice(1)}</div>
            <div style="${rowStyle()}"><span style="${labelStyle()}">Severity:&nbsp;</span>${severityBar(inc.severity)}</div>
            <div style="${rowStyle()}"><span style="${labelStyle()}">Description:&nbsp;</span>${inc.description || 'N/A'}</div>
            <div style="font-size:10px;color:#334155;margin-top:8px;padding-top:8px;border-top:1px solid #1e2d45;">
              ${inc.latitude}, ${inc.longitude}
            </div>
          </div>`

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(popup, { className: 'custom-popup', maxWidth: 260 })

        markersRef.current.push(marker)
      })
    })

    // Fit all markers
    if (markersRef.current.length > 0) {
      try {
        const group = L.featureGroup(markersRef.current)
        map.fitBounds(group.getBounds().pad(0.15))
      } catch (e) {}
    }

  }, [allResponders, incidents])

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
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Available Responders', value: available,  color: 'text-success', ring: '#22c55e' },
          { label: 'Busy Responders',      value: busy,        color: 'text-danger',  ring: '#ef4444' },
          { label: 'Dispatched',           value: dispatched,  color: 'text-success', ring: '#22c55e' },
          { label: 'Reported',             value: reported,    color: 'text-warning', ring: '#f59e0b' },
        ].map(({ label, value, color, ring }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div style={{ width:32, height:32, borderRadius:'50%', background: ring + '18', border: '2px solid ' + ring, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background: ring }} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs text-muted mr-1">Jump to:</span>
          {['all', 'mumbai', 'delhi', 'bangalore'].map(c => (
            <button key={c} onClick={() => setActiveCity(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                activeCity === c
                  ? 'bg-accent bg-opacity-20 text-accent border border-accent border-opacity-30'
                  : 'bg-subtle text-muted hover:text-white border border-border'
              }`}>{c === 'all' ? 'All India' : c}</button>
          ))}
        </div>
        <div className="flex items-center gap-5">
          {[
            { color: '#22c55e', shape: 'circle',  label: 'Available Responder' },
            { color: '#ef4444', shape: 'circle',  label: 'Busy Responder'      },
            { color: '#22c55e', shape: 'diamond', label: 'Dispatched Incident' },
            { color: '#f59e0b', shape: 'diamond', label: 'Reported Incident'   },
          ].map(({ color, shape, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {shape === 'circle'
                ? <div style={{ width:12, height:12, borderRadius:'50%', border:`2px solid ${color}`, background:`${color}20` }} />
                : <div style={{ width:10, height:10, border:`2px solid ${color}`, background:`${color}20`, transform:'rotate(45deg)' }} />
              }
              <span className="text-xs text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-border min-h-0">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  )
}