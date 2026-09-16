import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { legacyPanel } from './tooling/legacy.ts'

export default defineConfig({
  plugins: [react(), legacyPanel()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})
