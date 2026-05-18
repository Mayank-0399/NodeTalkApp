import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
      },
      '/chat.png': 'http://localhost:8000',
      '/bgimage.jpg': 'http://localhost:8000',
      '/ting.mp3': 'http://localhost:8000',
    },
  },
});
