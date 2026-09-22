import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Garante detecção imediata de arquivos salvos no Windows
    },
    hmr: {
      clientPort: 5173, // Força a conexão do WebSocket no navegador para a porta 5173
    },
  },
})
