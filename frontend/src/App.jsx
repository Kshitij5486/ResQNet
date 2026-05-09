import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import Responders from './pages/Responders'
import Layout from './components/layout/Layout'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="responders" element={<Responders />} />
        <Route path="map" element={<div className="text-white p-4">Live Map — Day 10</div>} />
        <Route path="monitoring" element={<div className="text-white p-4">Kafka Monitor — Day 12</div>} />
        <Route path="health" element={<div className="text-white p-4">Service Health — Day 13</div>} />
      </Route>
    </Routes>
  )
}

export default App