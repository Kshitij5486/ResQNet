import { Outlet } from 'react-router-dom'
export default function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}