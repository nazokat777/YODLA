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
    /*
     * Liga kalitlari testlarda ATAYLAB bo'sh.
     *
     * Vite `.env.local` ni `import.meta.env` ga yuklaydi, ya'ni backendni
     * sozlagan dasturchida `isCloudEnabled()` to'satdan `true` bo'lib,
     * "lokal rejim" testlari yiqilardi. Test natijasi mashina sozlamasiga
     * bog'liq bo'lmasligi kerak; bulut yo'lini sinaydigan testlar
     * `@/lib/supabase` ni o'zi mock qiladi.
     */
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
