import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const settings = await db.siteSetting.findMany()
  return NextResponse.json({ settings })
}

export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 })
    const setting = await db.siteSetting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(value) },
      update: { value: JSON.stringify(value) },
    })
    return NextResponse.json({ setting })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
