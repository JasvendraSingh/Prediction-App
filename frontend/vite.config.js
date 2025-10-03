import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const VITE_API_URL = process.env.VITE_API_URL || 'http://backend:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,               // Codespaces external access
    port: Number(process.env.FRONTEND_PORT) || 5173,
    open: false,
    proxy: {
      '/matches': {
        target: VITE_API_URL,
        changeOrigin: true,
        secure: false,       // allow self-signed / internal HTTPS
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(VITE_API_URL),
  },
});
