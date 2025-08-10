import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Semua request ke /api akan diteruskan ke backend Express
      '/api': {
        target: 'http://localhost:3000',  // sesuaikan port backend-mu
        changeOrigin: true,
        secure: false,
        // rewrite ini sebenarnya opsional karena path sudah sama
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/assets': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
    },
  },
});
