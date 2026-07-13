import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await db.siteContent.findMany()
  return NextResponse.json({ items })
}

export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { section, data } = await req.json()
    if (!section) return NextResponse.json({ error: "Section required" }, { status: 400 })

    const item = await db.siteContent.upsert({
      where: { section },
      create: { section, data: JSON.stringify(data || {}) },
      update: { data: JSON.stringify(data || {}) },
    })
    return NextResponse.json({ item })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
