import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJSON } from "@/lib/utils"
import { ensureDB } from "@/lib/ensure-db"

export async function GET(req: Request) {
  try {
    await ensureDB()
  } catch (e: any) {
    return NextResponse.json({ error: "DB init failed", details: e.message }, { status: 500 })
  }
  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section")

  if (section) {
    const item = await db.siteContent.findUnique({ where: { section } })
    return NextResponse.json({ data: item ? parseJSON(item.data, null) : null })
  }

  const items = await db.siteContent.findMany()
  const result: Record<string, any> = {}
  for (const item of items) {
    result[item.section] = parseJSON(item.data, null)
  }
  return NextResponse.json({ contents: result })
}
