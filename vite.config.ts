/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite konfiguratsiyasi: React + Tailwind v4 + Vitest
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@/..." ko'rinishidagi qisqa importlar uchun taxallus
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // SRS yadro logikasi uchun unit testlar (Faza 2'da to'ldiriladi)
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
