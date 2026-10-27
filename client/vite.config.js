import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// En developpement, tout appel a /api est redirige vers le serveur Express
// local (port 4000). Comme ca le front et le back partagent la meme origine
// en local -> les cookies de session fonctionnent sans config CORS compliquee.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
