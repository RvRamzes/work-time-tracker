import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/work-time-tracker/', // 👈 Вкажи тут ТОЧНУ назву репозиторію на GitHub (наприклад, '/work-time-tracker/')
})