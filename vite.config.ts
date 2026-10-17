import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // the precomputed fixtures are ~800 KB of JSON; they get their own chunk so app code can change
    // without busting the cached data, and the limit is raised to fit that one chunk
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/')) return 'fixtures'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router')) return 'react'
        },
      },
    },
  },
})
