import { NextResponse } from "next/server"
import { ensureDB } from "@/lib/ensure-db"
import { db } from "@/lib/db"

// GET /api/setup — initializes the database (creates tables + seeds demo data)
// Can be called by visiting https://your-site.vercel.app/api/setup in browser
export async function GET() {
  const startTime = Date.now()
  try {
    console.log("[/api/setup] Starting database initialization...")
    await ensureDB()

    // Return status info
    const [userCount, productCount, categoryCount, heroCount] = await Promise.all([
      db.user.count(),
      db.product.count(),
      db.category.count(),
      db.heroSlide.count(),
    ])

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully!",
      duration_ms: Date.now() - startTime,
      stats: {
        users: userCount,
        products: productCount,
        categories: categoryCount,
        heroSlides: heroCount,
      },
      adminCredentials: {
        email: "admin@houseofneelam.com",
        password: "Neelam@Admin2026",
      },
      env: {
        VERCEL: process.env.VERCEL || "local",
        DATABASE_URL_set: !!process.env.DATABASE_URL,
        DATABASE_URL_type: process.env.DATABASE_URL?.startsWith("libsql://")
          ? "turso"
          : process.env.DATABASE_URL?.startsWith("file:")
          ? "sqlite-local"
          : "unknown",
        DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
        NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
        CLOUDINARY_CLOUD_NAME_set: !!process.env.CLOUDINARY_CLOUD_NAME,
      },
    })
  } catch (e: any) {
    console.error("[/api/setup] Error:", e)
    return NextResponse.json(
      {
        success: false,
        error: e.message,
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
        env: {
          VERCEL: process.env.VERCEL || "local",
          DATABASE_URL_set: !!process.env.DATABASE_URL,
          DATABASE_URL_type: process.env.DATABASE_URL?.startsWith("libsql://")
            ? "turso"
            : process.env.DATABASE_URL?.startsWith("file:")
            ? "sqlite-local"
            : "unknown",
          DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
        },
        hint:
          "If DATABASE_URL is not set, sign up at https://turso.tech, create a database, and set DATABASE_URL + DATABASE_AUTH_TOKEN env vars in Vercel.",
      },
      { status: 500 }
    )
  }
}
