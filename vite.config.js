import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Smart-To-Do-App/',

  plugins: [
    react({
      babel: {
        presets: [reactCompilerPreset()],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})