import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo el navegador solo habla con Vite y Vite reenvía a la API: mismo origen, igual que en producción
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8090',
      '/ws': 'http://localhost:8090',
      '/graphql': 'http://localhost:8090',
      // Contratos que enlaza el portal (en producción los sirve la misma app)
      '/swagger-ui': 'http://localhost:8090',
      '/v3/api-docs': 'http://localhost:8090',
      '/graphiql': 'http://localhost:8090',
    },
  },
})
