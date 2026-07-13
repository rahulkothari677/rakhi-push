import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const update: any = {}
    const allowed = [
      "name", "category", "categoryId", "price", "compareAtPrice",
      "images", "primaryImage", "shortDescription", "description",
      "materials", "features", "badge", "inStock", "isActive", "isFeatured", "sku",
    ]
    for (const k of allowed) {
      if (body[k] !== undefined) {
        if (k === "images" || k === "materials" || k === "features") {
          update[k] = JSON.stringify(body[k] || [])
          if (k === "images" && Array.isArray(body[k])) {
            update.primaryImage = body[k][0] || ""
          }
        } else if (["price", "compareAtPrice", "inStock"].includes(k)) {
          update[k] = body[k] === null ? null : Number(body[k])
        } else if (k === "isFeatured" || k === "isActive") {
          update[k] = Boolean(body[k])
        } else {
          update[k] = body[k]
        }
      }
    }
    const product = await db.product.update({ where: { id }, data: update })
    return NextResponse.json({ product })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
