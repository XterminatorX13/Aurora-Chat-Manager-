import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: '/src/lib'
    }
  },
  base: './', // Important for Electron to load assets with relative paths

  build: {
    // Code Splitting Optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('marked')) return 'markdown-renderer';
            if (id.includes('highlight.js')) return 'syntax-highlighter';
            if (id.includes('katex')) return 'math-renderer';
            if (id.includes('svelte')) return 'svelte-runtime';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
