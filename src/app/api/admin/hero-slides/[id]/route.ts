import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const update: any = {}
    for (const k of ["title", "subtitle", "description", "image", "imageMobile", "ctaLabel", "ctaLink", "order", "isActive"]) {
      if (body[k] !== undefined) update[k] = body[k]
    }
    if (update.order !== undefined) update.order = Number(update.order)
    if (update.isActive !== undefined) update.isActive = Boolean(update.isActive)
    const slide = await db.heroSlide.update({ where: { id }, data: update })
    return NextResponse.json({ slide })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await db.heroSlide.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
