import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, AlertTriangle, Users, Map,
  Activity, Shield, LogOut, Bell, Brain,
  Zap, Radio, ChevronRight, Siren, Menu, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'

const NAV = [
  { to:'/',            icon:LayoutDashboard, label:'Dashboard',      sub:'Operations center'  },
  { to:'/incidents',   icon:Siren,           label:'Incidents',      sub:'SOS management'     },
  { to:'/responders',  icon:Users,           label:'Responders',     sub:'Unit tracker'       },
  { to:'/map',         icon:Map,             label:'Live Map',       sub:'GPS + heatmap'      },
  { to:'/monitoring',  icon:Activity,        label:'Kafka Monitor',  sub:'Pipeline health'    },
  { to:'/health',      icon:Shield,          label:'Service Health', sub:'System status'      },
  { to:'/ai',          icon:Brain,           label:'AI Insights',    sub:'ML predictions'     },
  { to:'/ai/events',   icon:Zap,             label:'AI Event Feed',  sub:'Real-time events'   },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data: kafka } = useQuery({
    queryKey: ['layout-kafka'],
    queryFn:  () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 8000,
  })
  const { data: incidents } = useQuery({
    queryKey: ['layout-incidents'],
    queryFn:  () => api.get('/api/incidents/my').then(r => r.data),
    refetchInterval: 10000,
  })

  const kafkaOk  = kafka?.overallStatus === 'HEALTHY'
  const totalLag = (kafka?.consumerGroups ?? []).reduce((s,g) => s+(g.totalLag??0), 0)
  const incList  = Array.isArray(incidents) ? incidents : []
  const pending  = incList.filter(i => i.status === 'REPORTED').length
  const critical = incList.filter(i => i.severity >= 4).length

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background:'#0a0a0f' }}>

      {/* Sidebar */}
      <aside className={`flex flex-col border-r transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background:'#0f0f1a', borderColor:'#1e2035' }}>

        {/* Logo */}
        <div className={`flex items-center border-b flex-shrink-0 ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4 gap-3'}`}
          style={{ borderColor:'#1e2035' }}>
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
            <Siren className="w-4 h-4 text-white"/>
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-black text-sm tracking-tight">ResQNet</p>
              <p className="text-xs" style={{ color:'#4a4a6a' }}>Emergency Response</p>
            </div>
          )}
        </div>

        {/* Status pill */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg border flex items-center gap-2"
            style={{ background:'#13131f', borderColor:'#1e2035' }}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${kafkaOk ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}/>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{kafkaOk ? 'All Systems Go' : 'System Alert'}</p>
              <p className="text-xs truncate" style={{ color:'#4a4a6a' }}>Lag: {totalLag} · {pending} pending</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {!collapsed && (
            <p className="text-xs font-bold uppercase tracking-widest px-2 py-2" style={{ color:'#4a4a6a' }}>Navigation</p>
          )}
          {NAV.map(({ to, icon:Icon, label, sub }) => {
            const badge = label === 'Incidents' && pending > 0 ? pending : null
            return (
              <NavLink key={to} to={to} end={to==='/'}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-150 group relative ${
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                  } ${isActive
                    ? 'text-white'
                    : 'hover:text-white'
                  }`
                }
                style={({ isActive }) => isActive
                  ? { background:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.1))', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa' }
                  : { color:'#6b6b8a' }
                }>
                {({ isActive }) => (
                  <>
                    <div className="relative flex-shrink-0">
                      <Icon className="w-4 h-4"/>
                      {badge && (
                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white font-bold" style={{fontSize:'8px'}}>{badge>9?'9+':badge}</span>
                        </div>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold truncate">{label}</p>
                          {badge && <span className="text-xs font-bold text-red-400">{badge}</span>}
                        </div>
                        <p className="text-xs truncate" style={{ color:'#4a4a6a' }}>{sub}</p>
                      </div>
                    )}
                    {isActive && !collapsed && <ChevronRight className="w-3 h-3 flex-shrink-0"/>}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                        style={{ background:'#1e2035', border:'1px solid #2a2a4a' }}>
                        {label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t p-2 space-y-1 flex-shrink-0" style={{ borderColor:'#1e2035' }}>
          {!collapsed && (
            <div className="px-3 py-2 rounded-lg border mb-2" style={{ background:'#13131f', borderColor:'#1e2035' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{user?.name?.charAt(0)??'K'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Kshitij'}</p>
                  <p className="text-xs truncate" style={{ color:'#4a4a6a' }}>Operator</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
                <span className="text-xs" style={{ color:'#4a4a6a' }}>Online</span>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center rounded-lg py-2 transition-all hover:text-white"
            style={{ color:'#4a4a6a', justifyContent: collapsed ? 'center' : 'flex-start', gap:'8px', padding: collapsed ? '8px' : '8px 12px' }}>
            {collapsed ? <Menu className="w-4 h-4"/> : <><X className="w-4 h-4"/><span className="text-xs">Collapse</span></>}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center rounded-lg py-2 transition-all hover:text-red-400"
            style={{ color:'#4a4a6a', justifyContent: collapsed ? 'center' : 'flex-start', gap:'8px', padding: collapsed ? '8px' : '8px 12px' }}>
            <LogOut className="w-4 h-4 flex-shrink-0"/>
            {!collapsed && <span className="text-xs font-medium">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 border-b px-6 py-3 flex items-center justify-between"
          style={{ background:'#0f0f1a', borderColor:'#1e2035' }}>
          <div>
            <p className="text-white font-bold text-sm">Emergency Operations Center</p>
            <p className="text-xs" style={{ color:'#4a4a6a' }}>Real-time monitoring and dispatch</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-blue-400"/>
                <span style={{ color:'#6b6b8a' }}>Connected</span>
              </div>
              <div style={{ color:'#2a2a4a' }}>|</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${kafkaOk ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}/>
                <span style={{ color:'#6b6b8a' }}>Kafka: <span className={`font-bold ${kafkaOk?'text-green-400':'text-red-400'}`}>{kafkaOk?'HEALTHY':'LAGGING'}</span></span>
              </div>
              <div style={{ color:'#2a2a4a' }}>|</div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3" style={{ color:'#4a4a6a' }}/>
                <span style={{ color:'#6b6b8a' }}>Lag: <span className="font-bold text-white">{totalLag}</span></span>
              </div>
              <div style={{ color:'#2a2a4a' }}>|</div>
              <div className="flex items-center gap-1.5">
                <Siren className="w-3 h-3" style={{ color:'#4a4a6a' }}/>
                <span style={{ color:'#6b6b8a' }}>Incidents: <span className="font-bold text-white">{incList.length||'--'}</span></span>
              </div>
            </div>
            <div style={{ color:'#2a2a4a' }}>|</div>
            {critical > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer"
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)' }}
                onClick={() => navigate('/incidents')}>
                <AlertTriangle className="w-3 h-3 text-red-400"/>
                <span className="text-xs font-bold text-red-400">{critical} CRITICAL</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-xs font-bold text-green-400">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
              <span className="text-xs font-mono" style={{ color:'#6b6b8a' }}>{time.toLocaleTimeString()}</span>
            </div>
            <button onClick={() => navigate('/incidents')} className="relative" style={{ color:'#4a4a6a' }}>
              <Bell className="w-4 h-4"/>
              {pending > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white font-bold" style={{fontSize:'7px'}}>{pending}</span>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background:'#0a0a0f' }}>
          <Outlet/>
        </main>
      </div>
    </div>
  )
}