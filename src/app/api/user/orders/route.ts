import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/user/orders — fetch orders for the logged-in customer
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const email = (session.user as any)?.email
    const orders = await db.order.findMany({
      where: { customerEmail: email },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    })

    return NextResponse.json({ orders })
  } catch (e: any) {
    console.error("Fetch orders error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
