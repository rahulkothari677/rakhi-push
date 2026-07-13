import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDB } from "@/lib/ensure-db"

export async function GET() {
  try {
    await ensureDB()
  } catch (e: any) {
    return NextResponse.json({ error: "DB init failed", details: e.message }, { status: 500 })
  }
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { products: { where: { isActive: true }, select: { id: true } } },
  })
  return NextResponse.json({
    categories: categories.map((c) => ({
      ...c,
      productCount: c.products.length,
      products: undefined,
    })),
  })
}
