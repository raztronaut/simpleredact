/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
    proxy: {
      '/stats': {
        target: 'https://cloud.umami.is',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stats/, ''),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'transformers': ['@huggingface/transformers'],
          'vendor': ['react', 'react-dom', 'zustand', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
