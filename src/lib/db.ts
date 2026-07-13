import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// Works with both local SQLite (file:) and Turso (libsql://) via env vars
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  // On Vercel, DATABASE_URL MUST be set to a Turso libsql URL
  // Local SQLite file paths don't work on Vercel's serverless functions
  if (process.env.VERCEL === '1' || process.env.CONTEXT === 'production') {
    if (!databaseUrl || databaseUrl.startsWith('file:')) {
      console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  DATABASE NOT CONFIGURED FOR PRODUCTION                           ║
║                                                                   ║
║  On Vercel/production, you MUST set these env vars:               ║
║  - DATABASE_URL       (libsql://... from Turso)                   ║
║  - DATABASE_AUTH_TOKEN (Turso auth token)                         ║
║                                                                   ║
║  Sign up free at https://turso.tech                               ║
╚══════════════════════════════════════════════════════════════════╝
`)
    }
  }

  const url = databaseUrl || 'file:./db/custom.db'

  // If using Turso (libsql://), use the adapter
  if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
    const libsql = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter } as any)
  }

  // Local SQLite file — direct Prisma connection
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
