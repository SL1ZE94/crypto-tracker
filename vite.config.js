import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/crypto-dashboard/', // 👈 Name deines GitHub-Repos
  plugins: [react()],
})
