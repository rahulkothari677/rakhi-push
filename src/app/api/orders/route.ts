import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateOrderNumber } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerCity,
      customerState,
      customerPincode,
      customerNotes,
      items,
      subtotal,
      shipping,
      total,
    } = body

    if (!customerName || !customerPhone || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields (name, phone, items)" },
        { status: 400 }
      )
    }

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        customerAddress: customerAddress || null,
        customerCity: customerCity || null,
        customerState: customerState || null,
        customerPincode: customerPincode || null,
        customerNotes: customerNotes || null,
        subtotal: Number(subtotal) || 0,
        shipping: Number(shipping) || 0,
        total: Number(total) || 0,
        whatsappSentAt: new Date(),
        items: {
          create: items.map((it: any) => ({
            productId: it.productId || null,
            name: it.name,
            image: it.image,
            price: Number(it.price),
            quantity: Number(it.quantity),
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ order })
  } catch (e: any) {
    console.error("Order create error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
