import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base:'/virtual-avatar/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
      '#':'/public'
    }
  }
})
