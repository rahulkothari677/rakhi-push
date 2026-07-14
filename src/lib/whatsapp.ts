import type { CartItem } from "./store"

export type WhatsAppConfig = {
  primaryNumber: string
  secondaryNumbers: string[]
  brandName: string
}

export function normalizeWhatsAppNumber(num: string): string {
  let cleaned = num.replace(/[^\d]/g, "")
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = "91" + cleaned.slice(1)
  }
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

// Modern, friendly WhatsApp message templates

export function buildSingleProductMessage(opts: {
  brandName: string
  productName: string
  price: number
  sku: string
  productUrl: string
  formatPrice: (n: number) => string
}): string {
  return `Hey ${opts.brandName}! 💫

I'm interested in this Rakhi:

✨ ${opts.productName}
💰 ${opts.formatPrice(opts.price)}
🏷️ ${opts.sku}

Is it available? Would love to order this one!`
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
   Qty: ${item.quantity} × ${opts.formatPrice(item.price)}
   = ${opts.formatPrice(item.price * item.quantity)}`
    )
    .join("\n\n")

  const customerLine = opts.customerName ? `\n👤 ${opts.customerName}\n` : "\n"

  return `Hey ${opts.brandName}! 💫

I'd like to order these Rakhis:${customerLine}
🛍️ Order:
${itemsList}

━━━━━━━━━━━━━
📋 Summary:
• Items: ${opts.items.length}
• Subtotal: ${opts.formatPrice(opts.subtotal)}
• Shipping: ${opts.shipping === 0 ? "FREE" : opts.formatPrice(opts.shipping)}
• Total: ${opts.formatPrice(opts.total)}

Please confirm availability & delivery details!`
}

export function buildQueryMessage(brandName: string): string {
  return `Hey ${brandName}! 💫

I have a question about your Rakhi collection. Can you help me?`
}
