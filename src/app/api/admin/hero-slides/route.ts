import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const slides = await db.heroSlide.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json({ slides })
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const slide = await db.heroSlide.create({
      data: {
        title: body.title || "",
        subtitle: body.subtitle || "",
        description: body.description || "",
        image: body.image || "",
        imageMobile: body.imageMobile || null,
        ctaLabel: body.ctaLabel || null,
        ctaLink: body.ctaLink || null,
        order: Number(body.order) || 0,
        isActive: Boolean(body.isActive ?? true),
      },
    })
    return NextResponse.json({ slide })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
