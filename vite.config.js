import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API server (npm run dev:api) runs on :3001
const api = `http://localhost:${process.env.API_PORT || 3001}`;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': api, '/uploads': api },
  },
  preview: {
    proxy: { '/api': api, '/uploads': api },
  },
});
