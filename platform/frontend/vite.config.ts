import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Temporarily disable React Compiler for debugging
      // babel: {
      //   plugins: [
      //     ['babel-plugin-react-compiler', {}],
      //   ],
      // },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ssr: {
    // Packages that need to be bundled for SSR (not treated as external)
    noExternal: [
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'recharts',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
    ],
  },
  build: {
    rollupOptions: {
      // SSR entry point for server-side rendering build
      // Used when running: vite build --ssr
      input: undefined, // Let Vite use default; SSR entry is specified via CLI
    },
  },
})
