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
    // Split search into keywords and match ANY keyword (OR logic per word).
    // This fixes the issue where AI image search returns multi-word queries
    // like "lumba peach floral beads" — previously this was treated as a
    // single phrase and matched 0 products.
    const keywords = search.trim().split(/\s+/).filter((k) => k.length >= 2)
    if (keywords.length === 1) {
      where.OR = [
        { name: { contains: keywords[0] } },
        { shortDescription: { contains: keywords[0] } },
        { description: { contains: keywords[0] } },
      ]
    } else if (keywords.length > 1) {
      // Match products that contain ANY of the keywords in name/description
      where.OR = keywords.flatMap((k) => [
        { name: { contains: k } },
        { shortDescription: { contains: k } },
        { description: { contains: k } },
      ])
    }
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
