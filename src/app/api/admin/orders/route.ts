import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })
  return NextResponse.json({ orders })
}
