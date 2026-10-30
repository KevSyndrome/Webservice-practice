import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El navegador solo habla con Vite; Vite reenvía a la API (evita CORS, también para SOAP)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8090',
      '/ws': 'http://localhost:8090',
    },
  },
})
