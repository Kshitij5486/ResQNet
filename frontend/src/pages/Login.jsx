import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Siren, Eye, EyeOff, Shield, Zap, Radio, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { HeroGeometric } from '../components/ui/HeroGeometric'

export default function Login() {
  const [email,    setEmail]    = useState('kshitij@test.com')
  const [password, setPassword] = useState('password123')
  const [showPass, setShowPass] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post('/api/auth/login', { email, password }).then(r => r.data),
    onSuccess: data => {
      setAuth(data.accessToken, data.userId)
      toast.success('Access granted')
      navigate('/')
    },
    onError: () => toast.error('Invalid credentials'),
  })

  return (
    <HeroGeometric
      badge="ResQNet · Emergency Operations"
      title1="AI-Powered"
      title2="Emergency Dispatch">

      <div className="flex flex-col lg:flex-row items-start justify-center gap-12 px-6 max-w-5xl mx-auto">

        {/* Feature cards */}
        <motion.div
          initial={{ opacity:0, x:-30 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.8, delay:0.9 }}
          className="hidden lg:flex flex-col gap-3 w-72 flex-shrink-0">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Platform Capabilities</p>
          {[
            { icon:Zap,           color:'#22c55e', label:'Sub-3s Dispatch',  sub:'Kafka → Haversine → assign'       },
            { icon:Shield,        color:'#6366f1', label:'JWT Secured',       sub:'HS256 · BCrypt · API Gateway'     },
            { icon:Radio,         color:'#f59e0b', label:'4 ML Models',       sub:'RandomForest · IsolationForest'   },
            { icon:AlertTriangle, color:'#ec4899', label:'21 Responders',     sub:'Mumbai · Delhi · Bangalore'       },
          ].map(({ icon:Icon, color, label, sub }) => (
            <div key={label} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-all">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color+'20' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{label}</p>
                <p className="text-white/30 text-xs">{sub}</p>
              </div>
            </div>
          ))}
          <div className="mt-2 pt-4 border-t border-white/[0.06]">
            <p className="text-white/20 text-xs leading-relaxed">
              Java 21 · Spring Boot · Kafka 3.7 · Python FastAPI · React 18 · PostgreSQL · Redis · Kubernetes
            </p>
          </div>
        </motion.div>

        {/* Login form */}
        <motion.div
          initial={{ opacity:0, x:30 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.8, delay:0.9 }}
          className="w-full max-w-sm">

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                <Siren className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Operator Access</p>
                <p className="text-white/40 text-xs">Emergency Operations Center</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && mutation.mutate()}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
                  placeholder="operator@resqnet.com" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && mutation.mutate()}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors pr-11"
                    placeholder="••••••••" />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                style={{ background:'linear-gradient(135deg, #6366f1, #ec4899)', color:'white' }}>
                {mutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Authenticating...</>
                  : <><Shield className="w-4 h-4"/>Access Operations Center</>
                }
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-5 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Demo Credentials</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-white/30">Email</span>
                  <span className="text-xs font-mono text-indigo-400">kshitij@test.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/30">Password</span>
                  <span className="text-xs font-mono text-indigo-400">password123</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/20 text-xs">
                No account?{' '}
                <button onClick={() => navigate('/register')} className="text-indigo-400 hover:text-indigo-300 transition-colors">Register</button>
              </p>
            </div>
          </div>

          <p className="text-center text-white/10 text-xs mt-4">ResQNet v1.0 · All 5 Sprints Complete</p>
        </motion.div>
      </div>
    </HeroGeometric>
  )
}