import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react"
import { Eye, EyeOff, UserPlus, Siren, Zap, Radio, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"
import api from "../api/axios"

export default function Register() {
  const [form,     setForm]     = useState({ fullName:"", email:"", password:"", confirm:"" })
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post("/api/auth/register", {
      fullName: form.fullName,
      email:    form.email,
      password: form.password,
    }).then(r => r.data),
    onSuccess: () => { toast.success("Account created! Please login."); navigate("/login") },
    onError:   () => toast.error("Registration failed"),
  })

  const handleSubmit = () => {
    if (!form.fullName || !form.email || !form.password) return toast.error("All fields required")
    if (form.password !== form.confirm) return toast.error("Passwords do not match")
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters")
    mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect-reg" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0.02 0 1 0 0 0.02 0 0 1 0 0.05 0 0 0 0.9 0"/>
          </filter>
          <filter id="gooey-filter-reg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey"/>
            <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
          </filter>
        </defs>
      </svg>

      {/* Mesh Gradient Background */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#000000","#0a0a1e","#1e0a0a","#0f172a","#0a1505"]}
        speed={0.1}
        backgroundColor="#000000"
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-20"
        colors={["#000000","#6366f1","#22c55e","#f59e0b"]}
        speed={0.05}
        wireframe="true"
        backgroundColor="transparent"
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-6">
        <motion.div className="flex items-center gap-3"
          initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6 }}>
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
            <Siren className="w-4 h-4 text-white"/>
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight">ResQNet</p>
            <p className="text-white/40 text-xs">Emergency Response</p>
          </div>
        </motion.div>

        <nav className="flex items-center space-x-2">
          {["Dashboard","Services","AI Models"].map(item => (
            <span key={item} className="text-white/60 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer">{item}</span>
          ))}
        </nav>

        <div className="relative flex items-center group" style={{ filter:"url(#gooey-filter-reg)" }}>
          <button onClick={() => navigate("/login")}
            className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </button>
          <button onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
            Login
          </button>
        </div>
      </header>

      {/* Left side hero */}
      <main className="absolute bottom-8 left-8 z-20 max-w-lg">
        <motion.div
          className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm mb-6 border border-white/10"
          style={{ filter:"url(#glass-effect-reg)" }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}>
          <span className="text-white/90 text-sm font-medium tracking-wide">🚨 Join the Emergency Network</span>
        </motion.div>

        <motion.h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-none tracking-tight"
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.4 }}>
          <motion.span className="block font-light text-4xl md:text-5xl mb-2 tracking-wider"
            style={{ background:"linear-gradient(135deg,#ffffff 0%,#6366f1 30%,#22c55e 70%,#ffffff 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Create Your
          </motion.span>
          <span className="block font-black text-white drop-shadow-2xl">Operator</span>
          <span className="block font-light text-white/80 italic">Account</span>
        </motion.h1>

        <motion.p className="text-base font-light text-white/60 mb-6 leading-relaxed"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.8 }}>
          Join 21 responders across Mumbai, Delhi and Bangalore. Access the full emergency operations center.
        </motion.p>

        <motion.div className="flex flex-wrap gap-3"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:1.0 }}>
          {[
            { icon:Zap,           label:"Sub-3s Dispatch",  color:"text-green-400"  },
            { icon:Radio,         label:"Kafka Streaming",  color:"text-blue-400"   },
            { icon:AlertTriangle, label:"AI Predictions",   color:"text-amber-400"  },
          ].map(({ icon:Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Icon className={`w-3 h-3 ${color}`}/>
              <span className="text-white/70 text-xs">{label}</span>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Register Form — right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-full max-w-sm">
        <motion.div
          initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.5 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-md"
          style={{ filter:"url(#glass-effect-reg)" }}>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center">
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
                <input type={showPass?"text":"password"} value={form.password}
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
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                placeholder="Repeat password"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"/>
            </div>

            <motion.button onClick={handleSubmit} disabled={mutation.isPending}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1 cursor-pointer"
              style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white" }}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
              {mutation.isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating account...</>
                : <><UserPlus className="w-4 h-4"/>Create Operator Account</>
              }
            </motion.button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-white/20 text-xs">
              Already have an account?{" "}
              <button onClick={()=>navigate("/login")} className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Pulsing border */}
      <div className="absolute bottom-8 right-8 z-30">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <PulsingBorder
            colors={["#6366f1","#4f46e5","#22c55e","#f59e0b","#ffffff"]}
            colorBack="#00000000"
            speed={0.8} roundness={1} thickness={0.1} softness={0.2}
            intensity={5} spotsPerColor={5} spotSize={0.1}
            pulse={0.1} smoke={0.2} smokeSize={4} scale={0.65}
            style={{ width:"60px", height:"60px", borderRadius:"50%" }}
          />
          <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100"
            animate={{ rotate:360 }}
            transition={{ duration:20, repeat:Infinity, ease:"linear" }}
            style={{ transform:"scale(1.6)" }}>
            <defs>
              <path id="circle3" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"/>
            </defs>
            <text className="text-sm fill-white/60 font-medium">
              <textPath href="#circle3" startOffset="0%">
                ResQNet • Join Now • Emergency Response • Register •
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10"/>
    </div>
  )
}