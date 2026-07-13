import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// Lazy singleton — PrismaClient is created on first use, NOT at module load time
// This ensures env vars are read at runtime (works on Vercel serverless)
let _prisma: PrismaClient | null = null

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  const isVercel = process.env.VERCEL === '1' || process.env.CONTEXT === 'production'

  // On Vercel, DATABASE_URL MUST be set to a Turso libsql URL
  if (isVercel && (!databaseUrl || databaseUrl.startsWith('file:'))) {
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  DATABASE NOT CONFIGURED FOR PRODUCTION                           ║
║                                                                   ║
║  On Vercel/production, you MUST set these env vars:               ║
║  - DATABASE_URL        (libsql://... from Turso)                  ║
║  - DATABASE_AUTH_TOKEN  (Turso auth token)                        ║
║                                                                   ║
║  Sign up free at https://turso.tech                               ║
╚══════════════════════════════════════════════════════════════════╝
`)
  }

  const url = databaseUrl || 'file:./db/custom.db'

  // If using Turso (libsql://), use the adapter pattern
  if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
    console.log('[db] Using Turso/libsql adapter with URL prefix:', url.slice(0, 25) + '...')
    const libsql = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    // Prisma v6 with driverAdapters supports the adapter option natively
    return new PrismaClient({ adapter })
  }

  // Local SQLite file — direct Prisma connection (dev only)
  console.log('[db] Using local SQLite file')
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) {
      _prisma = createPrismaClient()
    }
    // @ts-ignore — forward property access to the real client
    const value = (_prisma as any)[prop]
    return typeof value === 'function' ? value.bind(_prisma) : value
  },
})

// For tests / scripts that need direct access to the real client
export function getDb(): PrismaClient {
  if (!_prisma) {
    _prisma = createPrismaClient()
  }
  return _prisma
}
