import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Siren, Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { WebGLShader } from '../components/ui/WebGLShader'
import { LiquidButton } from '../components/ui/LiquidButton'

export default function Register() {
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirm:'' })
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post('/api/auth/register', {
      fullName: form.fullName,
      email:    form.email,
      password: form.password,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success('Account created! Please login.')
      navigate('/login')
    },
    onError: () => toast.error('Registration failed'),
  })

  const handleSubmit = () => {
    if (!form.fullName || !form.email || !form.password) return toast.error('All fields required')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    mutation.mutate()
  }

  const fadeUp = {
    hidden:  { opacity:0, y:30 },
    visible: i => ({ opacity:1, y:0, transition:{ duration:1, delay:0.3+i*0.15, ease:[0.25,0.4,0.25,1] } }),
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      {/* WebGL background */}
      <WebGLShader/>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none z-10"/>

      {/* Content */}
      <div className="relative z-20 w-full max-w-md px-6">

        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-xs text-white/60 tracking-wide">ResQNet · Emergency Operations</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">Create Your</span>
            <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">Operator Account</span>
          </h1>
          <p className="text-white/40 text-sm">Join the emergency response network</p>
        </motion.div>

        {/* Form card */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white"/>
              </div>
              <div>
                <p className="text-white font-bold text-sm">New Operator</p>
                <p className="text-white/40 text-xs">Emergency Operations Center</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Full Name</label>
                <input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}
                  placeholder="Kshitij Dev"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                  placeholder="operator@resqnet.com"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={form.password}
                    onChange={e=>setForm({...form,password:e.target.value})}
                    placeholder="Min 6 characters"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors pr-11"/>
                  <button onClick={()=>setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Confirm Password</label>
                <input type="password" value={form.confirm}
                  onChange={e=>setForm({...form,confirm:e.target.value})}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  placeholder="Repeat password"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"/>
              </div>

              {/* Liquid glass button */}
              <div className="flex justify-center pt-2">
                <LiquidButton
                  onClick={handleSubmit}
                  disabled={mutation.isPending}
                  className="text-white border border-white/20 rounded-full w-full"
                  size="xl">
                  {mutation.isPending
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating account...</>
                    : <><UserPlus className="w-4 h-4"/>Create Operator Account</>
                  }
                </LiquidButton>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-white/20 text-xs">
                Already have an account?{' '}
                <button onClick={()=>navigate('/login')} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sign in
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-white/10 text-xs mt-4">ResQNet v1.0 · All 5 Sprints Complete</p>
        </motion.div>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/60 pointer-events-none z-10"/>
    </div>
  )
}