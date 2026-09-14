import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const API_PORT = process.env.API_PORT ?? '5000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
    // Fail loudly if 5173 is taken - usually a second copy of the app - instead
    // of quietly starting elsewhere and leaving two frontends running.
    strictPort: true,
    // The browser only ever talks to this origin; /api is forwarded to Express.
    // That keeps the backend's host and port out of client code, and avoids CORS.
    proxy: {
      '/api': { target: `http://127.0.0.1:${API_PORT}` },
    },
  },
})
