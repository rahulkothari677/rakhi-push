import { NextResponse } from "next/server"
import { ensureDB } from "@/lib/ensure-db"
import { db } from "@/lib/db"
import { createClient } from '@libsql/client'

// GET /api/setup — initializes the database (creates tables + seeds demo data)
// Can be called by visiting https://your-site.vercel.app/api/setup in browser
export async function GET() {
  const startTime = Date.now()

  // Collect all diagnostic info first
  const databaseUrl = process.env.DATABASE_URL
  const env = {
    VERCEL: process.env.VERCEL || "local",
    NODE_ENV: process.env.NODE_ENV,
    CONTEXT: process.env.CONTEXT,
    DATABASE_URL_set: !!databaseUrl,
    DATABASE_URL_length: databaseUrl?.length || 0,
    DATABASE_URL_prefix: databaseUrl ? databaseUrl.slice(0, 25) + "..." : "(not set)",
    DATABASE_URL_type: databaseUrl?.startsWith("libsql://")
      ? "turso"
      : databaseUrl?.startsWith("file:")
      ? "sqlite-local"
      : databaseUrl?.startsWith("http")
      ? "https-turso"
      : "unknown",
    DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
    DATABASE_AUTH_TOKEN_length: process.env.DATABASE_AUTH_TOKEN?.length || 0,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL_set: !!process.env.NEXTAUTH_URL,
    CLOUDINARY_CLOUD_NAME_set: !!process.env.CLOUDINARY_CLOUD_NAME,
    GEMINI_API_KEY_set: !!process.env.GEMINI_API_KEY,
    GEMINI_API_KEY_prefix: process.env.GEMINI_API_KEY?.slice(0, 6) + "..." || "(not set)",
    XAI_API_KEY_set: !!process.env.XAI_API_KEY,
  }

  // Try direct libsql connection test (bypasses Prisma)
  let libsqlTest: any = null
  if (databaseUrl && databaseUrl.startsWith('libsql://')) {
    try {
      console.log("[/api/setup] Testing direct libsql connection...")
      const libsql = createClient({
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      })
      // Try a simple query
      const result = await libsql.execute("SELECT 1 as test")
      libsqlTest = {
        success: true,
        message: "Direct libsql connection works!",
        rows: result.rows.length,
      }
    } catch (e: any) {
      libsqlTest = {
        success: false,
        error: e.message,
        code: e.code,
      }
    }
  }

  // Try ensureDB (which uses Prisma via adapter)
  let initResult: any = null
  try {
    console.log("[/api/setup] Starting database initialization via ensureDB()...")
    await ensureDB()
    initResult = { success: true, message: "ensureDB completed" }
  } catch (e: any) {
    console.error("[/api/setup] ensureDB error:", e)
    initResult = {
      success: false,
      error: e.message,
      name: e.name,
      code: e.code,
      stack: process.env.NODE_ENV === "development" ? e.stack?.split("\n").slice(0, 5).join("\n") : undefined,
    }
  }

  // If init succeeded, get stats
  let stats: any = null
  if (initResult.success) {
    try {
      const [userCount, productCount, categoryCount, heroCount] = await Promise.all([
        db.user.count(),
        db.product.count(),
        db.category.count(),
        db.heroSlide.count(),
      ])
      stats = {
        users: userCount,
        products: productCount,
        categories: categoryCount,
        heroSlides: heroCount,
      }
    } catch (e: any) {
      stats = { error: e.message }
    }
  }

  const success = initResult.success && stats && !stats.error

  return NextResponse.json({
    success,
    message: success
      ? "Database initialized successfully! Your site is ready."
      : "Database initialization failed. See details below.",
    duration_ms: Date.now() - startTime,
    env,
    libsqlTest,
    initResult,
    stats,
    adminCredentials: success
      ? {
          email: "admin@houseofneelam.com",
          password: "Neelam@Admin2026",
        }
      : null,
    nextSteps: !success
      ? {
          issue:
            !databaseUrl
              ? "DATABASE_URL env var is NOT set on Vercel"
              : databaseUrl.startsWith('file:')
              ? "DATABASE_URL is set to a local SQLite path which doesn't work on Vercel. Set it to a Turso libsql:// URL."
              : !process.env.DATABASE_AUTH_TOKEN
              ? "DATABASE_AUTH_TOKEN is missing. Generate one from Turso dashboard."
              : libsqlTest && !libsqlTest.success
              ? "Direct libsql connection failed. Check your Turso URL and auth token."
              : "Unknown issue — see error details above.",
          fix: [
            "1. Sign up at https://turso.tech (free)",
            "2. Create a new database",
            "3. Copy the URL (looks like libsql://your-db.turso.io)",
            "4. Generate an auth token",
            "5. In Vercel: Settings → Environment Variables → add these for ALL environments (Production, Preview, Development):",
            "   DATABASE_URL = libsql://your-db.turso.io",
            "   DATABASE_AUTH_TOKEN = your-token",
            "   NEXTAUTH_SECRET = any-random-string",
            "   NEXTAUTH_URL = https://your-site.vercel.app",
            "6. Redeploy in Vercel",
            "7. Visit /api/setup again to initialize the DB",
          ],
        }
      : null,
  })
}
