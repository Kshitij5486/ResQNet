import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Siren, Eye, EyeOff, AlertTriangle, Shield, Zap, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [email,    setEmail]    = useState('kshitij@test.com')
  const [password, setPassword] = useState('password123')
  const [showPass, setShowPass] = useState(false)
  const { login }   = useAuthStore()
  const navigate    = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post('/api/auth/login', { email, password }).then(r => r.data),
    onSuccess: data => {
      login(data.token, data.user)
      toast.success('Access granted')
      navigate('/')
    },
    onError: () => toast.error('Invalid credentials'),
  })

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-900 border-r border-slate-800 p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 opacity-5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight">ResQNet</p>
              <p className="text-slate-500 text-xs">Emergency Response Platform</p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            AI-Powered<br/>
            <span className="text-blue-400">Emergency</span><br/>
            Dispatch
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Production-grade distributed emergency response system.
            Kafka event streaming · Haversine geospatial dispatch ·
            ML severity prediction · Real-time monitoring.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon:Zap,           color:'#22c55e', label:'Sub-3s Dispatch',      sub:'Kafka event → Haversine → assign' },
            { icon:Shield,        color:'#3b82f6', label:'JWT Secured',           sub:'HS256 · BCrypt · API Gateway'     },
            { icon:Radio,         color:'#f59e0b', label:'4 ML Models',           sub:'RandomForest · IsolationForest'   },
            { icon:AlertTriangle, color:'#8b5cf6', label:'21 Responders',         sub:'Mumbai · Delhi · Bangalore'       },
          ].map(({ icon:Icon, color, label, sub }) => (
            <div key={label} className="flex items-center gap-4 bg-slate-800 bg-opacity-50 rounded-xl px-4 py-3 border border-slate-700">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:color+'18' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-slate-500 text-xs">{sub}</p>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-600 text-xs">
              Java 21 · Spring Boot 3.3 · Apache Kafka 3.7 · Python FastAPI ·
              React 18 · PostgreSQL 16 · Redis 7 · Docker · Kubernetes
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
              <Siren className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-black text-lg">ResQNet</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Operator Access</h2>
            <p className="text-slate-500 text-sm">Sign in to the Emergency Operations Center</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && mutation.mutate()}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="operator@resqnet.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && mutation.mutate()}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {mutation.isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Authenticating...</>
                : <><Shield className="w-4 h-4"/>Access Operations Center</>
              }
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-xs font-mono text-blue-400">kshitij@test.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Password</span>
                <span className="text-xs font-mono text-blue-400">password123</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-xs">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Register
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-700 text-xs">ResQNet v1.0 · All 5 Sprints Complete</p>
            <p className="text-slate-800 text-xs mt-0.5">Java · Kafka · Python · React · Kubernetes</p>
          </div>
        </div>
      </div>
    </div>
  )
}