import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"
import { slugify } from "@/lib/utils"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
    include: { products: { select: { id: true } } },
  })
  return NextResponse.json({
    categories: categories.map((c) => ({
      ...c,
      productCount: c.products.length,
      products: undefined,
    })),
  })
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { name, description, image, imageMobile, icon, order, isActive } = body
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)
    const category = await db.category.create({
      data: {
        name,
        slug,
        description: description || "",
        image: image || null,
        imageMobile: imageMobile || null,
        icon: icon || null,
        order: Number(order) || 0,
        isActive: Boolean(isActive ?? true),
      },
    })
    return NextResponse.json({ category })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
