import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // '/socket.io': {
      //   target: 'http://localhost:8000',
      //   ws: true,
      // },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
});