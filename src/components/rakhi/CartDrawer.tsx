"use client"

import { useEffect, useState } from "react"
import { useStore, getCartTotal, getCartCount } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from "lucide-react"
import { cn, formatINR } from "@/lib/utils"
import { buildWhatsAppUrl, buildCartOrderMessage } from "@/lib/whatsapp"
import { thumbnailImage } from "@/lib/images"

export function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, updateCartQty, removeFromCart, setView } = useStore()
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null)
  const [shippingConfig, setShippingConfig] = useState<any>(null)

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
  const itemCount = getCartCount(cart)
  const freeShipAbove = shippingConfig?.freeAbove || 999
  const flatRate = shippingConfig?.flatRate || 49
  const shipping = subtotal >= freeShipAbove || subtotal === 0 ? 0 : flatRate
  const total = subtotal + shipping

  const handleCheckoutWhatsApp = () => {
    if (!whatsappConfig?.primaryNumber || cart.length === 0) return
    const message = buildCartOrderMessage({
      brandName: whatsappConfig.brandName || "House of Neelam",
      items: cart,
      subtotal,
      shipping,
      total,
      formatPrice: formatINR,
    })
    const url = buildWhatsAppUrl(whatsappConfig.primaryNumber, message)
    window.open(url, "_blank")

    // Save order to backend
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "WhatsApp Customer",
        customerPhone: "N/A",
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
    }).catch(() => {})

    setCartOpen(false)
    setView("cart")
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--background)] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--primary)] text-[var(--background)]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <h2 className="font-serif text-lg font-semibold">
                  Your Cart ({itemCount})
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="font-serif text-xl text-[var(--foreground)] mb-2">Your cart is empty</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-6">
                  Discover beautiful handcrafted Rakhis in our collection.
                </p>
                <button
                  onClick={() => {
                    setCartOpen(false)
                    setView("shop")
                  }}
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              <>
                {/* Free shipping progress */}
                {shipping > 0 && (
                  <div className="px-5 py-3 bg-[var(--cream)] border-b border-[var(--border)]">
                    <p className="text-xs text-[var(--foreground)] mb-1.5">
                      Add <span className="font-bold text-[var(--primary)]">{formatINR(freeShipAbove - subtotal)}</span> more for FREE shipping! 🚚
                    </p>
                    <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                        style={{ width: `${Math.min(100, (subtotal / freeShipAbove) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {shipping === 0 && subtotal > 0 && (
                  <div className="px-5 py-2.5 bg-[#5C8C3E]/10 border-b border-[var(--border)] text-center">
                    <p className="text-xs text-[#5C8C3E] font-semibold">
                      🎉 You've unlocked FREE shipping!
                    </p>
                  </div>
                )}

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {cart.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-3 bg-white p-3 rounded-lg border border-[var(--border)]"
                    >
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-[var(--background)] flex-shrink-0">
                        <img src={thumbnailImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-[var(--foreground)] line-clamp-2">{item.name}</h4>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">SKU: {item.sku}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-[var(--border)] rounded">
                            <button
                              onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--cream)] transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--cream)] transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[var(--primary)]">
                              {formatINR(item.price * item.quantity)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-xs text-[var(--muted-foreground)] hover:text-[#B3324A] flex items-center gap-1 mt-0.5"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-[var(--border)] p-5 space-y-3 bg-white">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">Subtotal</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">Shipping</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {shipping === 0 ? "FREE" : formatINR(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-[var(--border)]">
                      <span className="font-semibold text-[var(--foreground)]">Total</span>
                      <span className="font-bold text-[var(--primary)] text-lg">{formatINR(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutWhatsApp}
                    className="btn-luxe w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] text-white text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-colors"
                  >
                    <MessageCircle size={18} /> Send Order via WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setCartOpen(false)
                      setView("cart")
                    }}
                    className="w-full flex items-center justify-center gap-1 px-6 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    View Full Cart <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
