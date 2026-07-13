import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDB } from "@/lib/ensure-db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureDB()
  } catch (e: any) {
    return NextResponse.json({ error: "DB init failed", details: e.message }, { status: 500 })
  }
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug },
    include: { categoryRef: true },
  })
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  // related products
  const related = await db.product.findMany({
    where: {
      isActive: true,
      category: product.category,
      slug: { not: slug },
    },
    take: 4,
  })
  return NextResponse.json({ product, related })
}
