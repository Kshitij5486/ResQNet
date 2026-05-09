import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth':       { target: 'http://localhost:8080', changeOrigin: true },
      '/api/incidents':  { target: 'http://localhost:8080', changeOrigin: true },
      '/api/responders': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/monitoring': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/health/stats': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/health':     { target: 'http://localhost:8082', changeOrigin: true },
    }
  }
})