import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
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
