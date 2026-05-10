import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Brain, Activity, AlertTriangle, TrendingUp, Zap,
  RefreshCw, CheckCircle, XCircle, Clock, Shield,
  ChevronRight, BarChart2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import api from '../api/axios'

const CITIES  = ['mumbai', 'delhi', 'bangalore']
const TYPES   = ['FIRE', 'MEDICAL', 'POLICE', 'DISASTER']
const TYPE_COLORS = { FIRE:'#ef4444', MEDICAL:'#3b82f6', POLICE:'#f59e0b', DISASTER:'#8b5cf6' }

function RiskBadge({ level }) {
  const cfg = {
    LOW:      'bg-success bg-opacity-10 text-success border-success',
    MEDIUM:   'bg-warning bg-opacity-10 text-warning border-warning',
    HIGH:     'bg-orange-500 bg-opacity-10 text-orange-400 border-orange-500',
    CRITICAL: 'bg-danger bg-opacity-10 text-danger border-danger',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg[level] ?? cfg.MEDIUM} border-opacity-30`}>
      {level}
    </span>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function AIInsights() {
  const [selectedCity,   setSelectedCity]   = useState('mumbai')
  const [selectedType,   setSelectedType]   = useState('FIRE')
  const [selectedHour,   setSelectedHour]   = useState(new Date().getHours())
  const [selectedDay,    setSelectedDay]    = useState(new Date().getDay())

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['ai-health'],
    queryFn:  () => api.get('/api/ai/health').then(r => r.data),
    refetchInterval: 15000,
  })

  const { data: severity, isLoading: sevLoading, refetch: refetchSev } = useQuery({
    queryKey: ['ai-severity', selectedType, selectedCity, selectedHour, selectedDay],
    queryFn:  () => api.post('/api/ai/predict/severity', {
      type: selectedType, city: selectedCity, hour: selectedHour, day_of_week: selectedDay,
    }).then(r => r.data),
  })

  const { data: forecast, isLoading: foreLoading } = useQuery({
    queryKey: ['ai-forecast', selectedCity],
    queryFn:  () => api.get(`/api/ai/forecast/${selectedCity}?hours_ahead=24`).then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: allForecast } = useQuery({
    queryKey: ['ai-forecast-all'],
    queryFn:  () => api.get('/api/ai/forecast').then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: anomaly } = useQuery({
    queryKey: ['ai-anomaly'],
    queryFn:  () => api.get('/api/ai/predict/anomaly?incident_count=13&avg_response_time=3.2&available_responders=14&active_incidents=7').then(r => r.data),
    refetchInterval: 15000,
  })

  const { data: analytics } = useQuery({
    queryKey: ['ai-analytics'],
    queryFn:  () => api.get('/api/ai/analytics/summary').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: heatmap } = useQuery({
    queryKey: ['ai-heatmap'],
    queryFn:  () => api.get('/api/ai/analytics/heatmap').then(r => r.data),
  })

  const { data: cityAnalytics } = useQuery({
    queryKey: ['ai-city', selectedCity],
    queryFn:  () => api.get(`/api/ai/analytics/city/${selectedCity}`).then(r => r.data),
    refetchInterval: 30000,
  })

  // Build batch severity chart data
  const batchData = TYPES.map(t => ({
    type:  t,
    score: severity?.class_probabilities
      ? Object.entries(severity.class_probabilities).reduce((sum, [k,v]) => sum + parseInt(k)*v, 0)
      : 3,
  }))

  // Build city comparison chart
  const cityCompare = CITIES.map(city => {
    const f = allForecast?.[city]
    return {
      city:      city.charAt(0).toUpperCase() + city.slice(1),
      incidents: f?.total_predicted ?? 0,
      peak_hour: f?.peak_hour ?? 12,
    }
  })

  // Probability chart
  const probData = severity?.class_probabilities
    ? Object.entries(severity.class_probabilities).map(([k,v]) => ({
        severity: `Sev ${k}`,
        probability: Math.round(v * 100),
      }))
    : []

  // Forecast chart — show every other hour for readability
  const forecastChart = (forecast?.forecasts ?? [])
    .filter((_, i) => i % 2 === 0)
    .map(f => ({
      hour:       f.hour_label,
      incidents:  parseFloat(f.predicted_incidents.toFixed(1)),
      confidence: parseFloat((f.confidence * 10).toFixed(1)),
      peak:       f.peak,
    }))

  const modelsReady = health?.models_ready ?? false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            AI Insights
          </h1>
          <p className="text-muted text-sm mt-0.5">
            Machine learning predictions · ResQNet AI v1.0 · Python FastAPI + scikit-learn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            modelsReady
              ? 'bg-success bg-opacity-10 border-success border-opacity-30 text-success'
              : 'bg-warning bg-opacity-10 border-warning border-opacity-30 text-warning'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${modelsReady ? 'bg-success' : 'bg-warning'}`} />
            {modelsReady ? 'All Models Ready' : 'Models Loading'}
          </div>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-4 gap-3">
        {(health?.models ?? [
          {name:'severity_predictor'}, {name:'dispatch_scorer'},
          {name:'demand_forecaster'}, {name:'anomaly_detector'}
        ]).map(m => (
          <div key={m.name} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-4 h-4 text-accent" />
              <div className={`flex items-center gap-1 text-xs font-medium ${m.status === 'ready' ? 'text-success' : 'text-warning'}`}>
                {m.status === 'ready' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {m.status ?? 'ready'}
              </div>
            </div>
            <p className="text-xs font-semibold text-white capitalize">
              {m.name.replace(/_/g,' ')}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {m.name === 'severity_predictor'  && 'RandomForest · 200 trees'}
              {m.name === 'dispatch_scorer'     && 'Haversine + type weights'}
              {m.name === 'demand_forecaster'   && 'GradientBoosting · 150 trees'}
              {m.name === 'anomaly_detector'    && 'IsolationForest · 150 trees'}
            </p>
          </div>
        ))}
      </div>

      {/* Severity Predictor */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Severity Predictor</h3>
              <p className="text-xs text-muted mt-0.5">RandomForest · 5,000 training samples</p>
            </div>
            <button onClick={() => refetchSev()}
              className="text-muted hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Incident Type</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">City</label>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="w-full bg-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent capitalize">
                {CITIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Hour (0-23)</label>
              <input type="number" min="0" max="23" value={selectedHour}
                onChange={e => setSelectedHour(parseInt(e.target.value))}
                className="w-full bg-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Day (0=Mon)</label>
              <input type="number" min="0" max="6" value={selectedDay}
                onChange={e => setSelectedDay(parseInt(e.target.value))}
                className="w-full bg-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent" />
            </div>
          </div>

          {/* Result */}
          {sevLoading ? (
            <div className="h-32 bg-subtle rounded-lg animate-pulse" />
          ) : severity ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-subtle rounded-lg">
                <div>
                  <p className="text-xs text-muted">Predicted Severity</p>
                  <p className="text-3xl font-bold text-white">{severity.predicted_severity}<span className="text-sm text-muted">/5</span></p>
                </div>
                <div className="text-right">
                  <RiskBadge level={severity.risk_level} />
                  <p className="text-xs text-muted mt-1">Confidence: <span className="text-white font-medium">{(severity.confidence * 100).toFixed(1)}%</span></p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">{severity.reasoning}</p>
              <div className="flex flex-wrap gap-1.5">
                {severity.factors && Object.entries(severity.factors).map(([k,v]) => (
                  typeof v === 'boolean' && v && (
                    <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-accent bg-opacity-10 text-accent border border-accent border-opacity-20">
                      {k.replace(/_/g,' ')}
                    </span>
                  )
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Probability Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Severity Probability Distribution</h3>
          <p className="text-xs text-muted mb-4">Model confidence per severity level</p>
          {probData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={probData} margin={{ top:4, right:4, left:-20, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="severity" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'#1e2d4520' }} />
                <Bar dataKey="probability" radius={[4,4,0,0]} maxBarSize={40} name="Probability %">
                  {probData.map((_, i) => (
                    <Cell key={i} fill={i === (severity?.predicted_severity - 1) ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 bg-subtle rounded animate-pulse" />
          )}

          {/* Active factors */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted mb-2">Context Factors</p>
            <div className="grid grid-cols-2 gap-1.5">
              {severity?.factors && Object.entries(severity.factors).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-muted capitalize">{k.replace(/_/g,' ')}</span>
                  <span className={typeof v === 'boolean' ? (v ? 'text-warning font-medium' : 'text-muted') : 'text-white font-medium'}>
                    {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demand Forecast */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">24-Hour Demand Forecast</h3>
            <p className="text-xs text-muted mt-0.5">
              GradientBoosting model · 60-day training simulation
              {forecast && <span className="text-accent ml-2">· Peak: {forecast.peak_hour_label} · Total: {forecast.total_predicted} incidents</span>}
            </p>
          </div>
          <div className="flex gap-2">
            {CITIES.map(c => (
              <button key={c} onClick={() => setSelectedCity(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  selectedCity === c
                    ? 'bg-accent bg-opacity-20 text-accent border border-accent border-opacity-30'
                    : 'bg-subtle text-muted hover:text-white border border-border'
                }`}>{c}</button>
            ))}
          </div>
        </div>
        {foreLoading ? (
          <div className="h-48 bg-subtle rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecastChart} margin={{ top:4, right:20, left:-20, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke:'#3b82f6', strokeWidth:1 }} />
              <Legend wrapperStyle={{ fontSize:'11px', color:'#64748b' }} />
              <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} dot={false} name="Predicted Incidents" />
              <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Confidence x10" />
            </LineChart>
          </ResponsiveContainer>
        )}
        {forecast && (
          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-danger">{forecast.total_predicted}</p>
              <p className="text-xs text-muted">Total Predicted</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-warning">{forecast.peak_hour_label}</p>
              <p className="text-xs text-muted">Peak Hour</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{forecast.avg_per_hour}</p>
              <p className="text-xs text-muted">Avg / Hour</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{forecast.high_risk_hours?.length ?? 0}</p>
              <p className="text-xs text-muted">High Risk Hours</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom row — Anomaly + City Compare */}
      <div className="grid grid-cols-2 gap-4">
        {/* Anomaly Detection */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Anomaly Detection</h3>
          <p className="text-xs text-muted mb-4">IsolationForest · Real-time operational monitoring</p>
          {anomaly ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border ${
                anomaly.is_anomaly
                  ? 'bg-danger bg-opacity-5 border-danger border-opacity-20'
                  : 'bg-success bg-opacity-5 border-success border-opacity-20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {anomaly.is_anomaly
                      ? <AlertTriangle className="w-5 h-5 text-danger" />
                      : <CheckCircle className="w-5 h-5 text-success" />
                    }
                    <p className={`text-sm font-bold ${anomaly.is_anomaly ? 'text-danger' : 'text-success'}`}>
                      {anomaly.is_anomaly ? 'Anomaly Detected' : 'Normal Operations'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    anomaly.severity === 'NORMAL'   ? 'text-success border-success bg-success bg-opacity-10'
                    : anomaly.severity === 'ELEVATED' ? 'text-warning border-warning bg-warning bg-opacity-10'
                    : anomaly.severity === 'HIGH'     ? 'text-orange-400 border-orange-500 bg-orange-500 bg-opacity-10'
                    : 'text-danger border-danger bg-danger bg-opacity-10'
                  } border-opacity-30`}>{anomaly.severity}</span>
                </div>
                <p className="text-xs text-muted">{anomaly.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      anomaly.anomaly_score < 0.3 ? 'bg-success'
                      : anomaly.anomaly_score < 0.6 ? 'bg-warning'
                      : 'bg-danger'
                    }`} style={{ width: `${anomaly.anomaly_score * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted w-12 text-right">{(anomaly.anomaly_score * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">{anomaly.recommendation}</p>
              <div className="grid grid-cols-2 gap-2">
                {anomaly.metrics_analyzed && Object.entries(anomaly.metrics_analyzed).map(([k,v]) => (
                  <div key={k} className="bg-subtle rounded-lg px-3 py-2">
                    <p className="text-xs text-muted capitalize">{k.replace(/_/g,' ')}</p>
                    <p className="text-sm font-bold text-white">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-40 bg-subtle rounded animate-pulse" />}
        </div>

        {/* City Demand Comparison */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">City Demand Comparison</h3>
          <p className="text-xs text-muted mb-4">Predicted 24h incident volume across all cities</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cityCompare} margin={{ top:4, right:4, left:-20, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
              <XAxis dataKey="city" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'#1e2d4520' }} />
              <Bar dataKey="incidents" radius={[4,4,0,0]} maxBarSize={60} name="Predicted Incidents">
                {cityCompare.map((_, i) => (
                  <Cell key={i} fill={['#ef4444','#3b82f6','#22c55e'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Analytics summary */}
          {analytics && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Model Accuracy</span>
                <span className="text-success font-bold">{(analytics.avg_severity_accuracy * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Dispatch Optimization</span>
                <span className="text-accent font-bold">{analytics.dispatch_optimization}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Training Samples</span>
                <span className="text-white font-bold">{analytics.training_config?.severity_samples?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Last Retrained</span>
                <span className="text-white font-bold">{new Date(analytics.last_retrained).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}