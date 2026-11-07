import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // The preview proxy serves the app from *.e2b.app. Allow any host so the
    // sandboxed preview and local dev both load without a host check failure.
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: 'wss' },
    // Keep test/build artifacts out of the file watcher. Playwright writes
    // traces and screenshots under .arena during e2e runs; without this, every
    // artifact triggers a full page reload in the live preview.
    watch: {
      ignored: ['**/.arena/**', '**/test-results/**', '**/playwright-report/**', '**/dist/**', '**/coverage/**'],
    },
  },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
})
