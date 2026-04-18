import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dev server: proxy /api calls to the Node.js backend
  // so you don't need CORS headers during local development.
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },

  build: {
    outDir:       'dist',
    emptyOutDir:  true,
    sourcemap:    false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    }
  }
});
