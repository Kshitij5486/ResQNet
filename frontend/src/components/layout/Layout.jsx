import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, Users, Map,
  Activity, Shield, LogOut, Bell, ChevronRight, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import RealtimeStatusBar from '../ui/RealtimeStatusBar'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',     end: true },
  { to: '/incidents',  icon: AlertTriangle,   label: 'Incidents'              },
  { to: '/responders', icon: Users,           label: 'Responders'             },
  { to: '/map',        icon: Map,             label: 'Live Map'               },
  { to: '/monitoring', icon: Activity,        label: 'Kafka Monitor'          },
  { to: '/health',     icon: Shield,          label: 'Service Health'         },
]

export default function Layout() {
  const { logout } = useAuthStore()
  const navigate   = useNavigate()
  const [showNotif, setShowNotif] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-surface border-r border-border flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent bg-opacity-15 rounded-lg flex items-center justify-center border border-accent border-opacity-20">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm tracking-wide">ResQNet</h1>
              <p className="text-muted text-xs">Emergency Response</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-3">Navigation</p>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-accent bg-opacity-10 text-accent border border-accent border-opacity-15'
                    : 'text-muted hover:text-white hover:bg-subtle'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent' : 'text-muted group-hover:text-white'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-accent" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-accent bg-opacity-20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">K</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">Kshitij</p>
              <p className="text-muted text-xs">Operator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger hover:bg-opacity-10 transition-all">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-sm">Emergency Operations Center</h2>
            <p className="text-muted text-xs">Real-time monitoring and dispatch</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-success bg-opacity-10 border border-success border-opacity-20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-success text-xs font-medium">All Systems Operational</span>
            </div>
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-subtle border border-border text-muted hover:text-white hover:border-accent hover:border-opacity-40 transition-all">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
              </button>
              {showNotif && (
                <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-2xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <button onClick={() => setShowNotif(false)} className="text-muted hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-subtle">
                      <div className="w-2 h-2 rounded-full bg-success mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white">All systems operational</p>
                        <p className="text-xs text-muted mt-0.5">Kafka pipeline healthy · Lag: 0</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-subtle">
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white">ResQNet v1.0.0 running</p>
                        <p className="text-xs text-muted mt-0.5">4 services · 21 responders active</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-subtle">
                      <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white">Mumbai responders busy</p>
                        <p className="text-xs text-muted mt-0.5">All 5 Mumbai units on duty</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border">
                    <p className="text-xs text-muted text-center">No critical alerts</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Real-time status bar */}
        <RealtimeStatusBar />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}