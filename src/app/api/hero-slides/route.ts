import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDB } from "@/lib/ensure-db"

export async function GET() {
  try {
    await ensureDB()
  } catch (e: any) {
    return NextResponse.json({ error: "DB init failed", details: e.message }, { status: 500 })
  }
  const slides = await db.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })
  return NextResponse.json({ slides })
}
