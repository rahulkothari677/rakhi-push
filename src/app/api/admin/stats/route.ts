import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-guard"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [totalProducts, totalCategories, totalOrders, totalCustomers, recentOrders, featuredProducts, lowStockProducts] =
    await Promise.all([
      db.product.count(),
      db.category.count(),
      db.order.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      db.product.count({ where: { isFeatured: true } }),
      db.product.findMany({
        where: { inStock: { lt: 5 } },
        take: 5,
        select: { id: true, name: true, inStock: true, primaryImage: true },
      }),
    ])

  const orders = await db.order.findMany()
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length

  return NextResponse.json({
    totalProducts,
    totalCategories,
    totalOrders,
    totalCustomers,
    totalRevenue,
    pendingOrders,
    featuredProducts,
    recentOrders,
    lowStockProducts,
  })
}
