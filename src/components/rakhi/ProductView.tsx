"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Heart, ShoppingBag, MessageCircle, ChevronRight, Truck, Shield, Crown, Star, Check, Maximize2, X, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react"
import { cn, formatINR, parseJSON } from "@/lib/utils"
import { buildWhatsAppUrl, buildSingleProductMessage, normalizeWhatsAppNumber } from "@/lib/whatsapp"
import { ProductCard, type Product } from "./ProductCard"
import { productImageLarge, productImage, thumbnailImage } from "@/lib/images"

export function ProductView() {
  const {
    selectedProductSlug,
    openProduct,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setView,
  } = useStore()
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null)
  const [added, setAdded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setWhatsappConfig(d.settings?.whatsapp))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProductSlug) return
    setLoading(true)
    setActiveImage(0)
    setQuantity(1)
    fetch(`/api/products/${selectedProductSlug}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product)
        setRelated(d.related || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedProductSlug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-[var(--accent)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-[var(--foreground)] mb-4">Product not found</p>
          <button onClick={() => setView("shop")} className="text-[var(--primary)] underline">
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  const images: string[] = parseJSON(product.images, [])
  const materials: string[] = parseJSON(product.materials, [])
  const features: string[] = parseJSON(product.features, [])

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0

  const wishlisted = isWishlisted(product.id)

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.primaryImage,
      price: product.price,
      quantity,
      sku: product.sku,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyOnWhatsApp = () => {
    if (!whatsappConfig?.primaryNumber) return
    const message = buildSingleProductMessage({
      brandName: whatsappConfig.brandName || "House of Neelam",
      productName: product.name,
      price: product.price,
      sku: product.sku,
      productUrl: typeof window !== "undefined" ? window.location.href : "",
      formatPrice: formatINR,
    })
    const url = buildWhatsAppUrl(whatsappConfig.primaryNumber, message)
    window.open(url, "_blank")
  }

  return (
    <div className="bg-[var(--background)] min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <button onClick={() => setView("home")} className="hover:text-[var(--primary)]">Home</button>
          <ChevronRight size={12} />
          <button onClick={() => setView("shop")} className="hover:text-[var(--primary)]">Collection</button>
          <ChevronRight size={12} />
          <button onClick={() => useStore.getState().setCategory(product.category)} className="hover:text-[var(--primary)]">
            {product.category}
          </button>
          <ChevronRight size={12} />
          <span className="text-[var(--foreground)] font-medium truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <div className="bg-white rounded-lg overflow-hidden border border-[var(--border)] shadow-luxe">
              <div className="aspect-square bg-[var(--background)] relative cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                <img
                  src={productImageLarge(images[activeImage] || product.primaryImage)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[var(--primary)] shadow-sm">
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                      i === activeImage ? "border-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--accent)]"
                    )}
                  >
                    <img src={thumbnailImage(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent)] font-semibold mb-2">
                {product.category}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)] leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(product.rating) ? "text-[var(--accent)] fill-current" : "text-[var(--border)]"}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-4 border-y border-[var(--border)]">
              <span className="text-3xl sm:text-4xl font-bold text-[var(--primary)]">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-xl text-[var(--muted-foreground)] line-through">
                    {formatINR(product.compareAtPrice)}
                  </span>
                  <span className="px-2.5 py-1 bg-[var(--accent)] text-[var(--foreground)] text-xs font-bold rounded-full">
                    SAVE {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-base text-[var(--foreground)] font-medium mb-2">
                {product.shortDescription}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h3 className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-3">
                  Highlights
                </h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full border border-[var(--primary)]/20"
                    >
                      <Check size={12} className="text-[var(--accent)]" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {materials.length > 0 && (
              <div>
                <h3 className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-2">
                  Materials
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {materials.join(" • ")}
                </p>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[var(--foreground)]">Quantity:</span>
              <div className="flex items-center border border-[var(--border)] rounded-md overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--cream)] transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--cream)] transition-colors text-lg"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                SKU: <span className="font-mono">{product.sku}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  className={cn(
                    "btn-luxe flex items-center justify-center gap-2 px-6 py-4 text-sm tracking-elegant uppercase font-semibold rounded-md transition-colors",
                    added
                      ? "bg-[#5C8C3E] text-[var(--background)]"
                      : "bg-[var(--primary)] text-[var(--background)] hover:bg-[var(--primary-dark)]"
                  )}
                >
                  {added ? (
                    <><Check size={16} /> Added to Cart!</>
                  ) : (
                    <><ShoppingBag size={16} /> Add to Cart</>
                  )}
                </button>
                <button
                  onClick={handleBuyOnWhatsApp}
                  className="btn-luxe flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] text-white text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-colors"
                >
                  <MessageCircle size={16} /> Buy on WhatsApp
                </button>
              </div>

              <button
                onClick={() =>
                  toggleWishlist({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: product.primaryImage,
                    price: product.price,
                    sku: product.sku,
                  })
                }
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-6 py-3 border-2 text-sm tracking-elegant uppercase font-semibold rounded-md transition-colors",
                  wishlisted
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                )}
              >
                <Heart size={16} className={wishlisted ? "fill-current" : ""} />
                {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[var(--border)]">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Above ₹999" },
                { icon: Shield, label: "Secure Packaging", sub: "Gift-ready" },
                { icon: Crown, label: "Premium Quality", sub: "Handcrafted" },
              ].map((b, i) => (
                <div key={i} className="text-center">
                  <b.icon size={20} className="mx-auto text-[var(--accent)] mb-1" />
                  <div className="text-xs font-semibold text-[var(--foreground)]">{b.label}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">{b.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px w-12 bg-[var(--accent)]" />
                <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent)] font-medium">
                  You May Also Love
                </p>
                <div className="h-px w-12 bg-[var(--accent)]" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[var(--foreground)]">
                Complete <span className="text-gradient-burgundy italic">Your Celebration</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Lightbox */}
      {lightboxOpen && product && (
        <ImageLightbox
          images={images.length > 0 ? images : [product.primaryImage]}
          activeIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(i) => {
            setActiveImage(i)
          }}
        />
      )}
    </div>
  )
}

// ─── Fullscreen Image Lightbox Component ─────────────────────────────────────
function ImageLightbox({ images, activeIndex, onClose, onNavigate }: {
  images: string[]
  activeIndex: number
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  const [current, setCurrent] = useState(activeIndex)
  const [zoomed, setZoomed] = useState(false)

  const navigate = (dir: number) => {
    const next = (current + dir + images.length) % images.length
    setCurrent(next)
    onNavigate(next)
    setZoomed(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
    }
    window.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [current])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(-1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronRightIcon size={24} />
        </button>
      )}

      {/* Main image */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: zoomed ? 1.8 : 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-[90vw] max-h-[85vh]"
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed) }}
      >
        <img
          src={images[current]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain cursor-zoom-in"
        />
      </motion.div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); onNavigate(i); setZoomed(false) }}
              className={cn(
                "w-14 h-14 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                i === current ? "border-[var(--accent)] scale-110" : "border-white/30 opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Hint text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-elegant uppercase">
        {zoomed ? "Click to zoom out" : "Click image to zoom • ESC to close • ← → to navigate"}
      </div>
    </motion.div>
  )
}
