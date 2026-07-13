"use client"

import { useEffect, useState } from "react"
import { useStore, getCartTotal } from "@/lib/store"
import { motion } from "framer-motion"
import { Plus, Minus, Trash2, ShoppingBag, MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import { cn, formatINR } from "@/lib/utils"
import { buildWhatsAppUrl, buildCartOrderMessage } from "@/lib/whatsapp"
import { productImage, thumbnailImage } from "@/lib/images"

export function CartView() {
  const { cart, updateCartQty, removeFromCart, setView, clearCart } = useStore()
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null)
  const [shippingConfig, setShippingConfig] = useState<any>(null)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setWhatsappConfig(d.settings?.whatsapp)
        setShippingConfig(d.settings?.shipping)
      })
      .catch(() => {})
  }, [])

  const subtotal = getCartTotal(cart)
  const freeShipAbove = shippingConfig?.freeAbove || 999
  const flatRate = shippingConfig?.flatRate || 49
  const shipping = subtotal >= freeShipAbove || subtotal === 0 ? 0 : flatRate
  const total = subtotal + shipping

  const handleCheckoutWhatsApp = async () => {
    if (!whatsappConfig?.primaryNumber || cart.length === 0) return
    if (!customerForm.name || !customerForm.phone) {
      alert("Please provide at least your name and phone number so we can confirm your order.")
      return
    }
    const message = buildCartOrderMessage({
      brandName: whatsappConfig.brandName || "House of Neelam",
      customerName: customerForm.name,
      items: cart,
      subtotal,
      shipping,
      total,
      formatPrice: formatINR,
    })

    // Append shipping info
    const shippingInfo = `\n\n───────────────\n📍 *DELIVERY DETAILS*\nName: ${customerForm.name}\nPhone: ${customerForm.phone}${customerForm.email ? `\nEmail: ${customerForm.email}` : ""}${customerForm.address ? `\nAddress: ${customerForm.address}` : ""}${customerForm.city ? `\nCity: ${customerForm.city}` : ""}${customerForm.state ? `\nState: ${customerForm.state}` : ""}${customerForm.pincode ? `\nPincode: ${customerForm.pincode}` : ""}${customerForm.notes ? `\nNotes: ${customerForm.notes}` : ""}`

    const url = buildWhatsAppUrl(whatsappConfig.primaryNumber, message + shippingInfo)
    window.open(url, "_blank")

    // Save order
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerForm.name,
          customerPhone: customerForm.phone,
          customerEmail: customerForm.email || null,
          customerAddress: customerForm.address || null,
          customerCity: customerForm.city || null,
          customerState: customerForm.state || null,
          customerPincode: customerForm.pincode || null,
          customerNotes: customerForm.notes || null,
          items: cart.map((c) => ({
            productId: c.productId,
            name: c.name,
            image: c.image,
            price: c.price,
            quantity: c.quantity,
          })),
          subtotal,
          shipping,
          total,
        }),
      })
    } catch (e) {}

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[var(--background)] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white rounded-2xl p-8 sm:p-12 text-center shadow-luxe border border-[var(--border)]"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#5C8C3E]/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-[#5C8C3E]" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-[var(--foreground)] mb-3">
            Order Sent! 🎉
          </h2>
          <p className="text-[var(--muted-foreground)] mb-2">
            Your order has been forwarded to us via WhatsApp. We'll confirm your order and share payment details shortly.
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mb-8">
            Order Total: <span className="font-bold text-[var(--primary)]">{formatINR(total)}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                clearCart()
                setView("home")
              }}
              className="px-6 py-3 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => setView("shop")}
              className="px-6 py-3 border-2 border-[var(--primary)] text-[var(--primary)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary)] hover:text-[var(--background)] transition-colors"
            >
              Browse More Rakhis
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center">
          <div className="text-7xl mb-6">🛍️</div>
          <h2 className="font-serif text-3xl font-bold text-[var(--foreground)] mb-3">
            Your cart is empty
          </h2>
          <p className="text-[var(--muted-foreground)] mb-8 max-w-md">
            Discover beautiful handcrafted Rakhis in our collection. Each piece is made with devotion and love.
          </p>
          <button
            onClick={() => setView("shop")}
            className="px-8 py-3.5 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors inline-flex items-center gap-2"
          >
            Explore Collection <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-[var(--accent)]" />
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent)] font-medium">
              Shopping Cart
            </p>
            <div className="h-px w-12 bg-[var(--accent)]" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[var(--foreground)]">
            Your <span className="text-gradient-burgundy italic">Selection</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <motion.div
                key={item.productId}
                layout
                className="bg-white p-4 rounded-lg border border-[var(--border)] flex gap-4"
              >
                <div className="w-24 h-24 rounded-md overflow-hidden bg-[var(--background)] flex-shrink-0">
                  <img src={productImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-base font-semibold text-[var(--foreground)] line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">SKU: {item.sku}</p>
                  <p className="text-lg font-bold text-[var(--primary)] mt-1">{formatINR(item.price)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[var(--border)] rounded">
                      <button
                        onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--cream)] transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--cream)] transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--primary)]">
                        {formatINR(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[var(--muted-foreground)] hover:text-[#B3324A]"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <button
              onClick={() => setView("shop")}
              className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              ← Continue Shopping
            </button>
          </div>

          {/* Order summary + form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-[var(--border)] p-6 sticky top-28">
              <h3 className="font-serif text-lg font-bold text-[var(--foreground)] mb-4">
                Delivery Details
              </h3>

              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)]"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)]"
                />
                <textarea
                  placeholder="Full Address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)] resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                    className="px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)]"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={customerForm.state}
                    onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                    className="px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={customerForm.pincode}
                  onChange={(e) => setCustomerForm({ ...customerForm, pincode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)]"
                />
                <textarea
                  placeholder="Order Notes (optional)"
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] bg-[var(--background)] resize-none"
                />
              </div>

              <div className="divider-gold mb-4" />

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Subtotal ({cart.length} items)</span>
                  <span className="font-semibold text-[var(--foreground)]">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Shipping</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {shipping === 0 ? <span className="text-[#5C8C3E]">FREE</span> : formatINR(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] italic">
                    Add {formatINR(freeShipAbove - subtotal)} more for free shipping
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center py-3 border-t border-[var(--border)] mb-4">
                <span className="font-semibold text-[var(--foreground)]">Total</span>
                <span className="font-bold text-2xl text-[var(--primary)]">{formatINR(total)}</span>
              </div>

              <button
                onClick={handleCheckoutWhatsApp}
                className="btn-luxe w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] text-white text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-colors mb-2"
              >
                <MessageCircle size={18} /> Send Order via WhatsApp
              </button>
              <p className="text-xs text-[var(--muted-foreground)] text-center">
                You'll be redirected to WhatsApp with your order pre-filled. Just hit send and we'll take care of the rest!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
