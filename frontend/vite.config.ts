import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: false,
    // CSP permits local font files, not inline data URLs.
    assetsInlineLimit: (filePath) => /\.(woff2?|ttf|otf)$/i.test(filePath) ? false : undefined,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3100',
      '/locales': 'http://localhost:3100',
    },
  },
});
