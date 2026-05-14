import { PrismaClient } from '@/generated/prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma client instance.
 * Prevents multiple instances during Next.js hot-reload in development.
 */
const createPrismaClient = () => {
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    return new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
