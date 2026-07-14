import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"
import { slugify, generateSKU } from "@/lib/utils"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { categoryRef: true },
  })
  return NextResponse.json({ products })
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const {
      name,
      category,
      categoryId,
      price,
      compareAtPrice,
      images,
      imagesMobile,
      shortDescription,
      description,
      materials,
      features,
      badge,
      inStock,
      isFeatured,
      sku,
    } = body

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)
    const finalSku = sku || generateSKU()

    const product = await db.product.create({
      data: {
        slug,
        name,
        category: category || "Traditional",
        categoryId: categoryId || null,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        images: JSON.stringify(images || []),
        primaryImage: images?.[0] || "",
        imagesMobile: JSON.stringify(imagesMobile || []),
        primaryImageMobile: imagesMobile?.[0] || "",
        shortDescription: shortDescription || "",
        description: description || "",
        materials: JSON.stringify(materials || []),
        features: JSON.stringify(features || []),
        badge: badge || null,
        inStock: Number(inStock) || 50,
        isFeatured: Boolean(isFeatured),
        sku: finalSku,
      },
    })
    return NextResponse.json({ product })
  } catch (e: any) {
    console.error("Product create error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
