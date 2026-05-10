import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, AlertTriangle, Users, Map,
  Activity, Shield, LogOut, Bell, Brain,
  Zap, Radio, ChevronRight, Siren, Database,
  Menu, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'

const NAV = [
  { to:'/',            icon:LayoutDashboard, label:'Dashboard',     sub:'Operations center'  },
  { to:'/incidents',   icon:Siren,           label:'Incidents',     sub:'SOS management'     },
  { to:'/responders',  icon:Users,           label:'Responders',    sub:'Unit tracker'       },
  { to:'/map',         icon:Map,             label:'Live Map',      sub:'GPS + heatmap'      },
  { to:'/monitoring',  icon:Activity,        label:'Kafka Monitor', sub:'Pipeline health'    },
  { to:'/health',      icon:Shield,          label:'Service Health',sub:'System status'      },
  { to:'/ai',          icon:Brain,           label:'AI Insights',   sub:'ML predictions'     },
  { to:'/ai/events',   icon:Zap,             label:'AI Event Feed', sub:'Real-time events'   },
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

  const kafkaOk    = kafka?.overallStatus === 'HEALTHY'
  const totalLag   = (kafka?.consumerGroups ?? []).reduce((s,g) => s+(g.totalLag??0), 0)
  const incList    = Array.isArray(incidents) ? incidents : []
  const pending    = incList.filter(i => i.status === 'REPORTED').length
  const critical   = incList.filter(i => i.severity >= 4).length

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* Sidebar */}
      <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      }`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-slate-800 flex-shrink-0 ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4 gap-3'}`}>
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
            <Siren className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-black text-sm tracking-tight">ResQNet</p>
              <p className="text-slate-600 text-xs">Emergency Response</p>
            </div>
          )}
        </div>

        {/* Status pill */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${kafkaOk ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {kafkaOk ? 'All Systems Go' : 'System Alert'}
              </p>
              <p className="text-xs text-slate-500">
                Lag: {totalLag} · {pending} pending
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {!collapsed && (
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2 py-2">Navigation</p>
          )}
          {NAV.map(({ to, icon: Icon, label, sub }) => {
            const badge = label === 'Incidents' && pending > 0 ? pending : null
            const alert = label === 'Incidents' && critical > 0
            return (
              <NavLink key={to} to={to} end={to==='/'}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-150 group relative ${
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                  } ${isActive
                    ? 'bg-blue-600 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                  }`
                }>
                {({ isActive }) => (
                  <>
                    <div className="relative flex-shrink-0">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
                      {badge && (
                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold" style={{fontSize:'8px'}}>{badge>9?'9+':badge}</span>
                        </div>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'}`}>{label}</p>
                          {badge && <span className="text-xs font-bold text-red-400 flex-shrink-0">{badge}</span>}
                        </div>
                        <p className="text-xs text-slate-600 truncate">{sub}</p>
                      </div>
                    )}
                    {isActive && !collapsed && (
                      <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
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
        <div className="border-t border-slate-800 p-2 space-y-1 flex-shrink-0">
          {!collapsed && (
            <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{user?.name?.charAt(0)??'K'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Kshitij'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email ?? 'operator'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-slate-500">Operator · Online</span>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className={`w-full flex items-center rounded-lg py-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-all ${
              collapsed ? 'justify-center px-2' : 'gap-2 px-3'
            }`}>
            {collapsed ? <Menu className="w-4 h-4" /> : <><X className="w-4 h-4" /><span className="text-xs">Collapse</span></>}
          </button>
          <button onClick={handleLogout}
            className={`w-full flex items-center rounded-lg py-2 text-slate-500 hover:text-red-400 hover:bg-red-500 hover:bg-opacity-10 transition-all ${
              collapsed ? 'justify-center px-2' : 'gap-2 px-3'
            }`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">Emergency Operations Center</p>
            <p className="text-slate-500 text-xs">Real-time monitoring and dispatch</p>
          </div>
          <div className="flex items-center gap-5">
            {/* Live indicators */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-blue-400" />
                <span className="text-slate-400">Connected</span>
              </div>
              <div className="text-slate-700">|</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${kafkaOk ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
                <span className="text-slate-400">Kafka: <span className={`font-bold ${kafkaOk?'text-green-400':'text-red-400'}`}>{kafkaOk?'HEALTHY':'LAGGING'}</span></span>
              </div>
              <div className="text-slate-700">|</div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-slate-500" />
                <span className="text-slate-400">Lag: <span className="font-bold text-white">{totalLag}</span></span>
              </div>
              <div className="text-slate-700">|</div>
              <div className="flex items-center gap-1.5">
                <Siren className="w-3 h-3 text-slate-500" />
                <span className="text-slate-400">Incidents: <span className="font-bold text-white">{incList.length || '--'}</span></span>
              </div>
            </div>

            <div className="text-slate-700">|</div>

            {/* Alerts */}
            {critical > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 cursor-pointer hover:bg-opacity-20 transition-all"
                onClick={() => navigate('/incidents')}>
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-xs font-bold text-red-400">{critical} CRITICAL</span>
              </div>
            )}

            {/* All systems */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400">All Systems Operational</span>
            </div>

            {/* Clock */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-400">Last sync: {time.toLocaleTimeString()}</span>
            </div>

            {/* Bell */}
            <button className="relative text-slate-500 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              {pending > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white font-bold" style={{fontSize:'7px'}}>{pending}</span>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}