import { useEffect, useRef, useState } from "react"
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { Eye, EyeOff, Shield, Siren, Zap, Radio, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"
import api from "../api/axios"
import useAuthStore from "../store/authStore"

export default function Login() {
  const [email,     setEmail]     = useState("kshitij@test.com")
  const [password,  setPassword]  = useState("password123")
  const [showPass,  setShowPass]  = useState(false)
  const [isActive,  setIsActive]  = useState(false)
  const containerRef = useRef(null)
  const { setAuth }  = useAuthStore()
  const navigate     = useNavigate()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const enter = () => setIsActive(true)
    const leave = () => setIsActive(false)
    el.addEventListener("mouseenter", enter)
    el.addEventListener("mouseleave", leave)
    return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave) }
  }, [])

  const mutation = useMutation({
    mutationFn: () => api.post("/api/auth/login", { email, password }).then(r => r.data),
    onSuccess: data => {
      setAuth(data.accessToken, data.userId)
      toast.success("Access granted")
      navigate("/")
    },
    onError: () => toast.error("Invalid credentials"),
  })

  return (
    <div ref={containerRef} className="min-h-screen bg-black relative overflow-hidden">
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0.02 0 1 0 0 0.02 0 0 1 0 0.05 0 0 0 0.9 0" result="tint"/>
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey"/>
            <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
          </filter>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="30%" stopColor="#ef4444"/>
            <stop offset="70%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>
        </defs>
      </svg>

      {/* Mesh Gradient Background */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#000000", "#1e0a0a", "#0a0a1e", "#0f172a", "#1a0505"]}
        speed={0.1}
        backgroundColor="#000000"
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-20"
        colors={["#000000", "#ef4444", "#3b82f6", "#f59e0b"]}
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

        <div id="gooey-btn" className="relative flex items-center group" style={{ filter:"url(#gooey-filter)" }}>
          <button onClick={() => navigate("/register")}
            className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </button>
          <button onClick={() => navigate("/register")}
            className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
            Register
          </button>
        </div>
      </header>

      {/* Left side — hero text */}
      <main className="absolute bottom-8 left-8 z-20 max-w-lg">
        <motion.div
          className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm mb-6 border border-white/10"
          style={{ filter:"url(#glass-effect)" }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}>
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent rounded-full"/>
          <span className="text-white/90 text-sm font-medium relative z-10 tracking-wide">
            🚨 AI-Powered Emergency Dispatch
          </span>
        </motion.div>

        <motion.h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-none tracking-tight"
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.4 }}>
          <motion.span className="block font-light text-4xl md:text-5xl mb-2 tracking-wider"
            style={{ background:"linear-gradient(135deg,#ffffff 0%,#ef4444 30%,#3b82f6 70%,#ffffff 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            ResQNet
          </motion.span>
          <span className="block font-black text-white drop-shadow-2xl">Emergency</span>
          <span className="block font-light text-white/80 italic">Operations</span>
        </motion.h1>

        <motion.p className="text-base font-light text-white/60 mb-6 leading-relaxed"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.8 }}>
          Sub-3 second dispatch · Haversine geospatial · Kafka event streaming · 4 ML models
        </motion.p>

        <motion.div className="flex flex-wrap gap-3"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:1.0 }}>
          {[
            { icon:Zap,           label:"Sub-3s Dispatch",  color:"text-green-400" },
            { icon:Radio,         label:"Kafka Streaming",  color:"text-blue-400"  },
            { icon:AlertTriangle, label:"AI Predictions",   color:"text-amber-400" },
          ].map(({ icon:Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Icon className={`w-3 h-3 ${color}`}/>
              <span className="text-white/70 text-xs">{label}</span>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Login Form — right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-full max-w-sm">
        <motion.div
          initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.5 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-md"
          style={{ filter:"url(#glass-effect)" }}>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-600/80 flex items-center justify-center">
              <Siren className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Operator Access</p>
              <p className="text-white/40 text-xs">Emergency Operations Center</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&mutation.mutate()}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-500/60 transition-colors"
                placeholder="operator@resqnet.com"/>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&mutation.mutate()}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-500/60 transition-colors pr-11"
                  placeholder="••••••••"/>
                <button onClick={()=>setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <motion.button onClick={()=>mutation.mutate()} disabled={mutation.isPending}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1 cursor-pointer"
              style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"white" }}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
              {mutation.isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Authenticating...</>
                : <><Shield className="w-4 h-4"/>Access Operations Center</>
              }
            </motion.button>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-white/30">Email</span>
                <span className="text-xs font-mono text-red-400 cursor-pointer" onClick={()=>setEmail("kshitij@test.com")}>kshitij@test.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/30">Password</span>
                <span className="text-xs font-mono text-red-400 cursor-pointer" onClick={()=>setPassword("password123")}>password123</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-white/20 text-xs">
              No account?{" "}
              <button onClick={()=>navigate("/register")} className="text-red-400 hover:text-red-300 transition-colors">Register</button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Pulsing border bottom right */}
      <div className="absolute bottom-8 right-8 z-30">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <PulsingBorder
            colors={["#ef4444","#dc2626","#3b82f6","#f59e0b","#22c55e","#ffffff"]}
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
              <path id="circle2" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"/>
            </defs>
            <text className="text-sm fill-white/60 font-medium">
              <textPath href="#circle2" startOffset="0%">
                ResQNet • AI Dispatch • Kafka • ML Models • ResQNet •
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10"/>
    </div>
  )
}