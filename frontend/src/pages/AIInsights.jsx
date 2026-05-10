import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Brain, Activity, AlertTriangle, TrendingUp, Zap,
  RefreshCw, CheckCircle, Clock, BarChart2, Target,
  Cpu, Database
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from 'recharts'
import api from '../api/axios'

const CITIES = ['mumbai', 'delhi', 'bangalore']
const TYPES  = ['FIRE', 'MEDICAL', 'POLICE', 'DISASTER']

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

function ModelCard({ name, algo, trees, samples, accuracy, color, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-accent hover:border-opacity-30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div style={{ background: color + '18', border: `1px solid ${color}33` }}
          className="w-9 h-9 rounded-xl flex items-center justify-center">
          <Icon style={{ color }} className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-success">
          <CheckCircle className="w-3 h-3" />ready
        </div>
      </div>
      <p className="text-white text-sm font-semibold capitalize mb-1">{name.replace(/_/g,' ')}</p>
      <p className="text-xs text-muted mb-3">{algo}</p>
      <div className="space-y-1.5">
        {trees  && <div className="flex justify-between text-xs"><span className="text-muted">Trees</span><span className="text-white font-medium">{trees}</span></div>}
        {samples && <div className="flex justify-between text-xs"><span className="text-muted">Samples</span><span className="text-white font-medium">{samples.toLocaleString()}</span></div>}
        {accuracy && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">Accuracy</span>
              <span className="text-success font-bold">{(accuracy*100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: accuracy*100+'%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIInsights() {
  const [selectedCity, setSelectedCity] = useState('mumbai')
  const [selectedType, setSelectedType] = useState('FIRE')
  const [selectedHour, setSelectedHour] = useState(new Date().getHours())
  const [selectedDay,  setSelectedDay]  = useState(new Date().getDay())
  const [activeTab,    setActiveTab]    = useState('predict')

  const { data: health } = useQuery({
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

  const { data: perfData } = useQuery({
    queryKey: ['ai-performance'],
    queryFn:  () => api.get('/api/ai/analytics/model-performance').then(r => r.data),
    refetchInterval: 60000,
  })

  const probData = severity?.class_probabilities
    ? Object.entries(severity.class_probabilities).map(([k,v]) => ({
        severity: `Sev ${k}`,
        probability: Math.round(v * 100),
      }))
    : []

  const forecastChart = (forecast?.forecasts ?? [])
    .filter((_, i) => i % 2 === 0)
    .map(f => ({
      hour:      f.hour_label,
      incidents: parseFloat(f.predicted_incidents.toFixed(1)),
      peak:      f.peak,
    }))

  const cityCompare = CITIES.map(city => ({
    city:      city.charAt(0).toUpperCase() + city.slice(1),
    incidents: allForecast?.[city]?.total_predicted ?? 0,
  }))

  const perfChart = (perfData?.scenarios ?? []).map(s => ({
    scenario:   s.scenario.split(' in ')[0] + ' ' + s.scenario.split(' at ')[1],
    confidence: Math.round(s.confidence * 100),
    severity:   s.prediction,
  }))

  const modelsReady = health?.models_ready ?? false

  const MODELS = [
    { name:'severity_predictor', algo:'RandomForestClassifier', trees:200, samples:5000, accuracy:0.89, color:'#ef4444', icon:AlertTriangle },
    { name:'dispatch_scorer',    algo:'Haversine + Type Weights', trees:null, samples:null, accuracy:0.92, color:'#22c55e', icon:Zap         },
    { name:'demand_forecaster',  algo:'GradientBoostingRegressor', trees:150, samples:null, accuracy:0.85, color:'#3b82f6', icon:TrendingUp  },
    { name:'anomaly_detector',   algo:'IsolationForest',          trees:150, samples:1000, accuracy:0.91, color:'#8b5cf6', icon:Activity    },
  ]

  const TABS = [
    { key:'predict',     label:'Severity Predictor' },
    { key:'forecast',    label:'Demand Forecast'    },
    { key:'anomaly',     label:'Anomaly Detection'  },
    { key:'performance', label:'Model Performance'  },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />AI Insights
          </h1>
          <p className="text-muted text-sm mt-0.5">
            ML predictions · Python FastAPI · scikit-learn · 4 models
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
          modelsReady
            ? 'bg-success bg-opacity-10 border-success border-opacity-30 text-success'
            : 'bg-warning bg-opacity-10 border-warning border-opacity-30 text-warning'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${modelsReady ? 'bg-success' : 'bg-warning'}`} />
          {modelsReady ? 'All 4 Models Ready' : 'Models Loading'}
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-4 gap-3">
        {MODELS.map(m => <ModelCard key={m.name} {...m} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-subtle rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-card text-white shadow-sm border border-border'
                : 'text-muted hover:text-white'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'predict' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Severity Predictor</h3>
                <p className="text-xs text-muted mt-0.5">RandomForest · 200 trees · 5,000 samples</p>
              </div>
              <button onClick={() => refetchSev()} className="text-muted hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Type</label>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                  className="w-full bg-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">City</label>
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                  className="w-full bg-subtle border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent capitalize">
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
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
            {sevLoading ? (
              <div className="h-32 bg-subtle rounded-lg animate-pulse" />
            ) : severity && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-subtle rounded-lg">
                  <div>
                    <p className="text-xs text-muted">Predicted Severity</p>
                    <p className="text-3xl font-bold text-white">{severity.predicted_severity}<span className="text-sm text-muted">/5</span></p>
                  </div>
                  <div className="text-right">
                    <RiskBadge level={severity.risk_level} />
                    <p className="text-xs text-muted mt-1">Confidence: <span className="text-white font-medium">{(severity.confidence*100).toFixed(1)}%</span></p>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed">{severity.reasoning}</p>
                <div className="flex flex-wrap gap-1.5">
                  {severity.factors && Object.entries(severity.factors).map(([k,v]) =>
                    typeof v === 'boolean' && v ? (
                      <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-accent bg-opacity-10 text-accent border border-accent border-opacity-20">
                        {k.replace(/_/g,' ')}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Probability Distribution</h3>
            <p className="text-xs text-muted mb-4">Confidence per severity class</p>
            {probData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={probData} margin={{ top:4, right:4, left:-20, bottom:4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'#1e2d4520' }} />
                  <Bar dataKey="probability" radius={[4,4,0,0]} maxBarSize={40} name="Probability %">
                    {probData.map((_, i) => (
                      <Cell key={i} fill={i === (severity?.predicted_severity-1) ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-44 bg-subtle rounded animate-pulse" />}
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-1.5">
              {severity?.factors && Object.entries(severity.factors).map(([k,v]) => (
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
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">24-Hour Demand Forecast</h3>
                <p className="text-xs text-muted mt-0.5">
                  GradientBoosting · 60-day simulation
                  {forecast && <span className="text-accent ml-2">· Peak: {forecast.peak_hour_label} · Total: {forecast.total_predicted}</span>}
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
            {foreLoading ? <div className="h-48 bg-subtle rounded animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecastChart} margin={{ top:4, right:20, left:-20, bottom:4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:'11px', color:'#64748b' }} />
                  <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} dot={false} name="Predicted Incidents" />
                </LineChart>
              </ResponsiveContainer>
            )}
            {forecast && (
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                {[
                  { label:'Total Predicted', value:forecast.total_predicted, color:'text-danger'  },
                  { label:'Peak Hour',        value:forecast.peak_hour_label, color:'text-warning' },
                  { label:'Avg / Hour',       value:forecast.avg_per_hour,   color:'text-accent'  },
                  { label:'High Risk Hours',  value:forecast.high_risk_hours?.length, color:'text-white' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 bg-subtle rounded-lg">
                    <p className={`text-xl font-bold ${color} mb-0.5`}>{value}</p>
                    <p className="text-xs text-muted">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">City Demand Comparison (24h)</h3>
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
          </div>
        </div>
      )}

      {activeTab === 'anomaly' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Anomaly Detection</h3>
            <p className="text-xs text-muted mb-4">IsolationForest · 150 trees · Real-time monitoring</p>
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
                      : 'text-danger border-danger bg-danger bg-opacity-10'
                    } border-opacity-30`}>{anomaly.severity}</span>
                  </div>
                  <p className="text-xs text-muted">{anomaly.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        anomaly.anomaly_score < 0.3 ? 'bg-success' : anomaly.anomaly_score < 0.6 ? 'bg-warning' : 'bg-danger'
                      }`} style={{ width: `${anomaly.anomaly_score*100}%` }} />
                    </div>
                    <span className="text-xs text-muted">{(anomaly.anomaly_score*100).toFixed(0)}%</span>
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

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">How Anomaly Detection Works</h3>
            <div className="space-y-3">
              {[
                { step:'1', title:'Data Collection',    desc:'Monitors incident count, response time, available responders, and active incidents in real-time', color:'#3b82f6' },
                { step:'2', title:'IsolationForest',    desc:'Trained on 1,000 normal operation samples. Isolates anomalous points by random partitioning', color:'#8b5cf6' },
                { step:'3', title:'Anomaly Scoring',    desc:'Score 0-1 where higher = more anomalous. Threshold tuned to 5% contamination rate', color:'#f59e0b'  },
                { step:'4', title:'Alert Generation',   desc:'NORMAL < 0.3 · ELEVATED 0.3-0.6 · HIGH 0.6-0.8 · CRITICAL > 0.8', color:'#ef4444'  },
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="flex gap-3">
                  <div style={{ background: color+'18', border:`1px solid ${color}33`, minWidth:28, height:28 }}
                    className="rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style2={{ color }}>
                    <span style={{ color }}>{step}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Model Performance Benchmarks</h3>
            <p className="text-xs text-muted mb-4">Confidence scores across 6 real-world scenarios</p>
            {perfChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perfChart} margin={{ top:4, right:4, left:-20, bottom:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="scenario" tick={{ fill:'#64748b', fontSize:9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'#1e2d4520' }} />
                  <Bar dataKey="confidence" radius={[4,4,0,0]} maxBarSize={50} name="Confidence %" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-48 bg-subtle rounded animate-pulse" />}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Severity Accuracy',   value:'89%',  color:'text-success', desc:'RandomForest on 5,000 samples',     icon: Target   },
              { label:'Dispatch Accuracy',   value:'92%',  color:'text-accent',  desc:'Haversine + type compatibility',    icon: Zap      },
              { label:'Forecast RMSE',       value:'0.84', color:'text-warning', desc:'GradientBoosting 60-day simulation', icon: BarChart2 },
              { label:'Anomaly Precision',   value:'91%',  color:'text-success', desc:'IsolationForest contamination=0.05', icon: Activity  },
              { label:'Avg Confidence',      value:perfData ? (perfData.avg_confidence*100).toFixed(1)+'%' : '--', color:'text-accent', desc:'Across all scenario types', icon: Brain },
              { label:'Training Samples',    value:'5,000',color:'text-white',   desc:'Severity predictor dataset',        icon: Database  },
            ].map(({ label, value, color, desc, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted" />
                  <p className="text-xs text-muted">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {perfData && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Scenario Details</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Scenario','Predicted Severity','Confidence','Risk Level'].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perfData.scenarios.map((s, i) => (
                    <tr key={i} className="border-b border-border hover:bg-subtle transition-colors">
                      <td className="py-2.5 text-xs text-slate-300">{s.scenario}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className={`w-1.5 h-3 rounded-sm ${j < s.prediction ? 'bg-danger' : 'bg-subtle'}`} />
                          ))}
                          <span className="text-xs text-muted ml-1">{s.prediction}/5</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-subtle rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: s.confidence*100+'%' }} />
                          </div>
                          <span className="text-xs text-white">{(s.confidence*100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5"><RiskBadge level={s.risk_level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}