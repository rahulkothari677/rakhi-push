import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// Detect environment
const databaseUrl = process.env.DATABASE_URL
const isVercel = process.env.VERCEL === '1'

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

// Create the Prisma client once
function createPrismaClient(): PrismaClient {
  const url = databaseUrl || 'file:./db/custom.db'

  // If using Turso (libsql://), use the adapter pattern
  if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
    console.log('[db] Creating Prisma client with Turso/libsql adapter, URL prefix:', url.slice(0, 25) + '...')
    const libsql = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite file — direct Prisma connection (dev only)
  console.log('[db] Creating Prisma client with local SQLite:', url)
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// Use global to avoid creating new clients on every hot reload in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
