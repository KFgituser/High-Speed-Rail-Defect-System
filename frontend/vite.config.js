import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    clearMocks: true
  },
  server: {
    port: 3000,
    host: 'localhost',
    open: true, // 自动打开浏览器
    // Keep local IDE development compatible with the same /api paths used in Docker.
    proxy: {
      '/api': 'http://localhost:8080',
      '/plots': 'http://localhost:8080',
      '/thumbs': 'http://localhost:8080',
      '/viz-out': 'http://localhost:8080',
      '/viz3d-out': 'http://localhost:8080',
      '/viz3damp-out': 'http://localhost:8080'
    }
  }
});
