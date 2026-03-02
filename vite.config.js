import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  server: {
    proxy: {
      // High-quality logos via Google's faviconV2 API (256px PNG)
      '/gstatic-proxy': {
        target: 'https://t1.gstatic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gstatic-proxy/, ''),
      },
      // Clearbit (kept as fallback — may be dead)
      '/logo-proxy': {
        target: 'https://logo.clearbit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/logo-proxy/, ''),
      },
      // DuckDuckGo favicon fallback
      '/ddg-proxy': {
        target: 'https://icons.duckduckgo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ddg-proxy/, ''),
      },
      // Google favicon fallback
      '/favicon-proxy': {
        target: 'https://www.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/favicon-proxy/, ''),
      },
      // Clipdrop background removal (user supplies their own API key)
      '/clipdrop-proxy': {
        target: 'https://clipdrop-api.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clipdrop-proxy/, ''),
      },
    },
  },
})
