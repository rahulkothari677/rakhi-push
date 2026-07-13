import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDB } from "@/lib/ensure-db"

export async function GET(req: Request) {
  try {
    await ensureDB()
  } catch (e: any) {
    console.error("[/api/products] DB init error:", e.message)
    return NextResponse.json(
      { error: "Database initialization failed. Please check DATABASE_URL env var.", details: e.message },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const featured = searchParams.get("featured")
  const search = searchParams.get("search")
  const limit = parseInt(searchParams.get("limit") || "0")

  const where: any = { isActive: true }
  if (category && category !== "all") {
    where.category = category
  }
  if (featured === "true") {
    where.isFeatured = true
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { shortDescription: { contains: search } },
      { description: { contains: search } },
    ]
  }

  let query = db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { categoryRef: true },
  })
  let products = await query
  if (limit > 0) products = products.slice(0, limit)

  return NextResponse.json({ products })
}
