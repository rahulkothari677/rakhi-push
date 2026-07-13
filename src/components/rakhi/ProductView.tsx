"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Heart, ShoppingBag, MessageCircle, ChevronRight, Truck, Shield, Crown, Star, Check } from "lucide-react"
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
          <div className="w-16 h-16 mx-auto border-4 border-[#C9A24B] border-t-[#8B1E3E] rounded-full animate-spin" />
          <p className="mt-4 text-sm text-[#6B5544]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-[#2A0A0F] mb-4">Product not found</p>
          <button onClick={() => setView("shop")} className="text-[#8B1E3E] underline">
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
    <div className="bg-[#FBF6EC] min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-[#6B5544]">
          <button onClick={() => setView("home")} className="hover:text-[#8B1E3E]">Home</button>
          <ChevronRight size={12} />
          <button onClick={() => setView("shop")} className="hover:text-[#8B1E3E]">Collection</button>
          <ChevronRight size={12} />
          <button onClick={() => useStore.getState().setCategory(product.category)} className="hover:text-[#8B1E3E]">
            {product.category}
          </button>
          <ChevronRight size={12} />
          <span className="text-[#2A0A0F] font-medium truncate">{product.name}</span>
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
            <div className="bg-white rounded-lg overflow-hidden border border-[#E8D9B8] shadow-luxe">
              <div className="aspect-square bg-[#FBF6EC]">
                <img
                  src={productImageLarge(images[activeImage] || product.primaryImage)}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
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
                      i === activeImage ? "border-[#8B1E3E]" : "border-[#E8D9B8] hover:border-[#C9A24B]"
                    )}
                  >
                    <img src={thumbnailImage(img)} alt="" className="w-full h-full object-contain" />
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
              <p className="text-xs tracking-[0.3em] uppercase text-[#C9A24B] font-semibold mb-2">
                {product.category}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2A0A0F] leading-tight">
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
                    className={i < Math.round(product.rating) ? "text-[#C9A24B] fill-current" : "text-[#E8D9B8]"}
                  />
                ))}
              </div>
              <span className="text-sm text-[#6B5544]">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-4 border-y border-[#E8D9B8]">
              <span className="text-3xl sm:text-4xl font-bold text-[#8B1E3E]">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-xl text-[#6B5544] line-through">
                    {formatINR(product.compareAtPrice)}
                  </span>
                  <span className="px-2.5 py-1 bg-[#C9A24B] text-[#2A0A0F] text-xs font-bold rounded-full">
                    SAVE {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-base text-[#2A0A0F] font-medium mb-2">
                {product.shortDescription}
              </p>
              <p className="text-sm text-[#6B5544] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h3 className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-3">
                  Highlights
                </h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4EAD5] text-[#2A0A0F] text-xs rounded-full border border-[#E8D9B8]"
                    >
                      <Check size={12} className="text-[#8B1E3E]" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {materials.length > 0 && (
              <div>
                <h3 className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-2">
                  Materials
                </h3>
                <p className="text-sm text-[#6B5544]">
                  {materials.join(" • ")}
                </p>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#2A0A0F]">Quantity:</span>
              <div className="flex items-center border border-[#E8D9B8] rounded-md overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#8B1E3E] hover:bg-[#F4EAD5] transition-colors text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#8B1E3E] hover:bg-[#F4EAD5] transition-colors text-lg"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-[#6B5544]">
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
                      ? "bg-[#5C8C3E] text-[#FBF6EC]"
                      : "bg-[#8B1E3E] text-[#FBF6EC] hover:bg-[#6B0E2A]"
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
                    ? "border-[#8B1E3E] bg-[#8B1E3E] text-[#FBF6EC]"
                    : "border-[#E8D9B8] text-[#2A0A0F] hover:border-[#8B1E3E] hover:text-[#8B1E3E]"
                )}
              >
                <Heart size={16} className={wishlisted ? "fill-current" : ""} />
                {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#E8D9B8]">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Above ₹999" },
                { icon: Shield, label: "Secure Packaging", sub: "Gift-ready" },
                { icon: Crown, label: "Premium Quality", sub: "Handcrafted" },
              ].map((b, i) => (
                <div key={i} className="text-center">
                  <b.icon size={20} className="mx-auto text-[#C9A24B] mb-1" />
                  <div className="text-xs font-semibold text-[#2A0A0F]">{b.label}</div>
                  <div className="text-[10px] text-[#6B5544]">{b.sub}</div>
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
                <div className="h-px w-12 bg-[#C9A24B]" />
                <p className="text-xs tracking-[0.3em] uppercase text-[#C9A24B] font-medium">
                  You May Also Love
                </p>
                <div className="h-px w-12 bg-[#C9A24B]" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#2A0A0F]">
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
    </div>
  )
}
