import { useQuery } from '@tanstack/react-query'
import { Activity, Wifi } from 'lucide-react'
import api from '../../api/axios'

export default function RealtimeStatusBar() {
  const { data: kafka, dataUpdatedAt } = useQuery({
    queryKey: ['kafka-lag'],
    queryFn:  () => api.get('/api/monitoring/kafka/lag').then(r => r.data),
    refetchInterval: 8000,
  })

  const { data: emergency } = useQuery({
    queryKey: ['health', 'emergency'],
    queryFn:  () => api.get('/api/health').then(r => r.data),
    refetchInterval: 10000,
  })

  const isHealthy  = kafka?.overallStatus === 'HEALTHY'
  const totalLag   = kafka?.consumerGroups?.reduce((s, g) => s + g.totalLag, 0) ?? 0
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--'

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-surface border-b border-border text-xs">
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3 h-3 text-success" />
        <span className="text-muted">Connected</span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHealthy ? 'bg-success' : 'bg-danger'}`} />
        <span className="text-muted">Kafka: <span className={isHealthy ? 'text-success font-medium' : 'text-danger font-medium'}>{isHealthy ? 'HEALTHY' : 'LAGGING'}</span></span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-muted" />
        <span className="text-muted">Lag: <span className={totalLag === 0 ? 'text-success font-medium' : 'text-warning font-medium'}>{totalLag}</span></span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-muted">Incidents: <span className="text-white font-medium">{emergency?.totalIncidents ?? '--'}</span></span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-muted">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span>Last sync: {lastUpdate}</span>
      </div>
    </div>
  )
}