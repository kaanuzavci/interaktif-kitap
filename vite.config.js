import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite yapılandırması:
// - react()       : JSX dosyalarını derler, hızlı yenileme (HMR) sağlar
// - tailwindcss() : Tailwind v4'ü Vite'a bağlar (ayrı config dosyası gerekmez)
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
