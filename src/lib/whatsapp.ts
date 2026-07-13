import type { CartItem } from "./store"

export type WhatsAppConfig = {
  primaryNumber: string
  secondaryNumbers: string[]
  brandName: string
}

export function normalizeWhatsAppNumber(num: string): string {
  // Strip all non-digit chars except leading +
  let cleaned = num.replace(/[^\d]/g, "")
  // If starts with 91 and length is 12, keep as is
  // If starts with 0 and length is 11, strip the 0 and add 91
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = "91" + cleaned.slice(1)
  }
  // If length is 10, assume India and add 91
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned
  }
  return cleaned
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(phone)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

export function buildSingleProductMessage(opts: {
  brandName: string
  productName: string
  price: number
  sku: string
  productUrl: string
  formatPrice: (n: number) => string
}): string {
  return `🙏 Namaste ${opts.brandName}!

I would like to purchase this beautiful Rakhi:

🪔 *${opts.productName}*
💰 Price: ${opts.formatPrice(opts.price)}
🏷️ SKU: ${opts.sku}
🔗 View: ${opts.productUrl}

Please let me know the availability and next steps.

Thank you!`
}

export function buildCartOrderMessage(opts: {
  brandName: string
  customerName?: string
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  formatPrice: (n: number) => string
}): string {
  const itemsList = opts.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name}
   • Qty: ${item.quantity}
   • Price: ${opts.formatPrice(item.price)}
   • Subtotal: ${opts.formatPrice(item.price * item.quantity)}
   • SKU: ${item.sku}`
    )
    .join("\n\n")

  return `🙏 Namaste ${opts.brandName}!

I would like to place an order for the following Rakhis${
    opts.customerName ? ` (Customer: ${opts.customerName})` : ""
  }:

${itemsList}

───────────────
🧾 *ORDER SUMMARY*
• Items: ${opts.items.length}
• Subtotal: ${opts.formatPrice(opts.subtotal)}
• Shipping: ${opts.shipping === 0 ? "FREE" : opts.formatPrice(opts.shipping)}
• *Total: ${opts.formatPrice(opts.total)}*

Please confirm the order and share payment & delivery details.

Thank you! 🪔✨`
}
