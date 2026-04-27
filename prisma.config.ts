import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env.local first (higher priority), then .env as fallback
config({ path: '.env.local' })
config({ path: '.env' })

const provider = process.env['DATABASE_PROVIDER'] ?? 'sqlite'
const isSQLite = provider === 'sqlite'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL']!,
    // directUrl is only meaningful for PostgreSQL (bypasses connection pooler)
    ...(isSQLite ? {} : { directUrl: process.env['DIRECT_URL'] }),
  },
})
