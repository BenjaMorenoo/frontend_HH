import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.spec.{js,cjs,mjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: []
  }
})
