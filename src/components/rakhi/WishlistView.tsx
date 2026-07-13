"use client"

import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Heart, ShoppingBag, ArrowRight, Trash2, MessageCircle } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { buildWhatsAppUrl, buildSingleProductMessage } from "@/lib/whatsapp"
import { productImage } from "@/lib/images"
import { useEffect, useState } from "react"

export function WishlistView() {
  const { wishlist, openProduct, addToCart, removeFromWishlist, setView } = useStore()
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setWhatsappConfig(d.settings?.whatsapp))
      .catch(() => {})
  }, [])

  const handleBuySingle = (item: typeof wishlist[0]) => {
    if (!whatsappConfig?.primaryNumber) return
    const message = buildSingleProductMessage({
      brandName: whatsappConfig.brandName || "House of Neelam",
      productName: item.name,
      price: item.price,
      sku: item.sku,
      productUrl: typeof window !== "undefined" ? window.location.href : "",
      formatPrice: formatINR,
    })
    window.open(buildWhatsAppUrl(whatsappConfig.primaryNumber, message), "_blank")
  }

  const moveAllToCart = () => {
    wishlist.forEach((item) =>
      addToCart({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: 1,
        sku: item.sku,
      })
    )
    setView("cart")
  }

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-[var(--accent)]" />
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent)] font-medium flex items-center gap-2">
              <Heart size={14} className="fill-current" /> Saved Items
            </p>
            <div className="h-px w-12 bg-[var(--accent)]" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[var(--foreground)]">
            Your <span className="text-gradient-burgundy italic">Wishlist</span>
          </h1>
          <p className="text-[var(--muted-foreground)] mt-3">
            {wishlist.length === 0
              ? "Your wishlist is waiting to be filled with love."
              : `${wishlist.length} ${wishlist.length === 1 ? "Rakhi" : "Rakhis"} saved for later`}
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">💝</div>
            <h3 className="font-serif text-2xl font-bold text-[var(--foreground)] mb-3">
              No favorites yet
            </h3>
            <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
              Tap the heart icon on any Rakhi to save it here. Build your perfect collection and order all your favorites at once.
            </p>
            <button
              onClick={() => setView("shop")}
              className="px-8 py-3.5 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors inline-flex items-center gap-2"
            >
              Explore Collection <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-6 gap-3">
              <button
                onClick={moveAllToCart}
                className="px-5 py-2.5 bg-[var(--primary)] text-[var(--background)] text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors inline-flex items-center gap-2"
              >
                <ShoppingBag size={14} /> Move All to Cart
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlist.map((item, i) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white rounded-lg overflow-hidden shadow-luxe hover:shadow-luxe-hover transition-all border border-[var(--border)]/60"
                >
                  <button
                    onClick={() => openProduct(item.slug)}
                    className="block w-full aspect-square overflow-hidden bg-[var(--background)] relative"
                  >
                    <img
                      src={productImage(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </button>

                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[var(--primary)] text-[var(--background)] flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors"
                    style={{ position: "relative", marginLeft: "auto", marginTop: "-3rem" }}
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="p-4 text-center">
                    <h3 className="font-serif text-base font-semibold text-[var(--foreground)] line-clamp-2 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-[var(--primary)] mb-3">{formatINR(item.price)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          addToCart({
                            productId: item.productId,
                            slug: item.slug,
                            name: item.name,
                            image: item.image,
                            price: item.price,
                            quantity: 1,
                            sku: item.sku,
                          })
                        }
                        className="flex-1 py-2 bg-[var(--primary)] text-[var(--background)] text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleBuySingle(item)}
                        className="px-3 py-2 bg-[#25D366] text-white rounded-md hover:bg-[#1FAE54] transition-colors"
                        aria-label="Buy on WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
