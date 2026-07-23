"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingBag, MessageCircle, Heart, Check, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn, formatINR } from "@/lib/utils"
import { productImage, thumbnailImage } from "@/lib/images"
import { buildWhatsAppUrl, buildSingleProductMessage } from "@/lib/whatsapp"
import { showAddedToCart, showAddedToWishlist, showRemovedFromWishlist } from "@/lib/toast-helpers"

type Product = {
  id: string
  slug: string
  name: string
  category: string
  price: number
  compareAtPrice?: number | null
  primaryImage: string
  images: string
  shortDescription: string
  description: string
  materials: string
  features: string
  badge?: string | null
  sku: string
  primaryImageMobile?: string | null
  rating: number
  reviewCount: number
}

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { openProduct, addToCart, toggleWishlist, isWishlisted } = useStore()
  const [activeImage, setActiveImage] = useState(0)
  const [added, setAdded] = useState(false)
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null)

  useEffect(() => {
    if (!whatsappConfig) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => setWhatsappConfig(d.settings?.whatsapp))
        .catch(() => {})
    }
  }, [whatsappConfig])

  useEffect(() => {
    if (product) {
      setActiveImage(0)
      setAdded(false)
      // Lock body scroll
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [product])

  if (!product) return null

  const images: string[] = (() => {
    try { return JSON.parse(product.images || "[]") } catch { return [] }
  })()

  const allImages = images.length > 0 ? images : [product.primaryImage]
  const features: string[] = (() => {
    try { return JSON.parse(product.features || "[]") } catch { return [] }
  })()

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const wishlisted = isWishlisted(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.primaryImage,
      price: product.price,
      quantity: 1,
      sku: product.sku,
    })
    setAdded(true)
    showAddedToCart(product.name)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!whatsappConfig?.primaryNumber) return
    const message = buildSingleProductMessage({
      brandName: whatsappConfig.brandName || "House of Neelam",
      productName: product.name,
      price: product.price,
      sku: product.sku,
      productUrl: typeof window !== "undefined" ? window.location.href : "",
      formatPrice: formatINR,
    })
    window.open(buildWhatsAppUrl(whatsappConfig.primaryNumber, message), "_blank")
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasWishlisted = wishlisted
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.primaryImage,
      price: product.price,
      sku: product.sku,
    })
    if (wasWishlisted) showRemovedFromWishlist(product.name)
    else showAddedToWishlist(product.name)
  }

  const navigateImage = (dir: number) => {
    setActiveImage((prev) => (prev + dir + allImages.length) % allImages.length)
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--background)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[var(--cream)] hover:bg-[var(--accent)]/20 flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Image section */}
              <div className="relative bg-[var(--cream)]">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={productImage(allImages[activeImage])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image navigation */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage(-1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                    >
                      <ChevronLeft size={18} className="text-[var(--primary)]" />
                    </button>
                    <button
                      onClick={() => navigateImage(1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                    >
                      <ChevronRight size={18} className="text-[var(--primary)]" />
                    </button>

                    {/* Thumbnails */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={cn(
                            "w-12 h-12 rounded-md overflow-hidden border-2 transition-all",
                            i === activeImage ? "border-[var(--primary)] scale-110" : "border-white/50 opacity-60"
                          )}
                        >
                          <img src={thumbnailImage(img)} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.badge && (
                    <span className="px-2.5 py-1 bg-[var(--primary)] text-white text-[9px] tracking-wide uppercase font-semibold rounded-full shadow-sm">
                      {product.badge}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-2.5 py-1 bg-[var(--accent)] text-[var(--foreground)] text-[9px] tracking-wide uppercase font-bold rounded-full shadow-sm">
                      {discount}% OFF
                    </span>
                  )}
                </div>

                {/* Wishlist */}
                <button
                  onClick={handleWishlist}
                  className={cn(
                    "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm",
                    wishlisted
                      ? "bg-[var(--primary)] text-white scale-110"
                      : "bg-white/90 backdrop-blur-sm text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                  )}
                >
                  <Heart size={16} className={wishlisted ? "fill-current" : ""} />
                </button>
              </div>

              {/* Info section */}
              <div className="p-6 flex flex-col">
                {/* Category */}
                <p className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1">
                  {product.category}
                </p>

                {/* Name */}
                <h2 className="font-serif text-2xl font-bold text-[var(--foreground)] mb-2 leading-tight">
                  {product.name}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.round(product.rating) ? "text-[var(--accent)] fill-current" : "text-[var(--border)]"} />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-[var(--primary)]">{formatINR(product.price)}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm text-[var(--muted-foreground)] line-through">{formatINR(product.compareAtPrice)}</span>
                  )}
                </div>

                {/* Short description */}
                <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">
                  {product.shortDescription}
                </p>

                {/* Features */}
                {features.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-2">Highlights</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {features.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded-full border border-[var(--primary)]/20">
                          <Check size={10} className="text-[var(--accent)]" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleAddToCart}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 text-sm tracking-wide uppercase font-semibold rounded-md transition-all",
                        added ? "bg-[#5C8C3E] text-white" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                      )}
                    >
                      {added ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-colors"
                    >
                      <MessageCircle size={16} /> Buy Now
                    </button>
                  </div>
                  <button
                    onClick={() => { onClose(); openProduct(product.slug) }}
                    className="w-full py-2.5 text-sm text-[var(--primary)] hover:underline font-medium"
                  >
                    View Full Details →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
