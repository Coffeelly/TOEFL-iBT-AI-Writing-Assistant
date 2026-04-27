import { defineConfig } from 'vitest/config'
import path from 'path'
import { config as loadEnv } from 'dotenv'

// Load environment variables before any test modules are imported.
// .env.local overrides .env (mirrors Next.js env loading order).
loadEnv({ path: path.resolve(__dirname, '.env') })
loadEnv({ path: path.resolve(__dirname, '.env.local'), override: true })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
