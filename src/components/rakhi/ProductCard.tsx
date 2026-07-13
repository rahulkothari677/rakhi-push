"use client"

import { useStore } from "@/lib/store"
import { Heart, ShoppingBag, MessageCircle, Plus, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, formatINR } from "@/lib/utils"
import { productImage } from "@/lib/images"
import { buildWhatsAppUrl, buildSingleProductMessage } from "@/lib/whatsapp"
import { useEffect, useState } from "react"

export type Product = {
  id: string
  slug: string
  name: string
  category: string
  price: number
  compareAtPrice?: number | null
  primaryImage: string
  images: string
  shortDescription: string
  badge?: string | null
  isFeatured: boolean
  rating: number
  reviewCount: number
  sku: string
}

type Props = {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: Props) {
  const { openProduct, addToCart, toggleWishlist, isWishlisted } = useStore()
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

  const wishlisted = isWishlisted(product.id)

  const images: string[] = (() => {
    try {
      return JSON.parse(product.images || "[]")
    } catch {
      return []
    }
  })()

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0

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
    setTimeout(() => setAdded(false), 2000)
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
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.primaryImage,
      price: product.price,
      sku: product.sku,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative bg-white rounded-xl overflow-hidden shadow-luxe hover:shadow-luxe-hover transition-all duration-500 hover-lift border border-[#E8D9B8]/60 flex flex-col"
    >
      {/* Image */}
      <div
        onClick={() => openProduct(product.slug)}
        className="block w-full aspect-square overflow-hidden bg-[#FBF6EC] relative cursor-pointer"
      >
        <img
          src={productImage(product.primaryImage)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        {/* Subtle gradient overlay for premium depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          {product.badge && (
            <span className="px-3 py-1 bg-[#8B1E3E] text-[#FBF6EC] text-[10px] tracking-elegant uppercase font-semibold rounded-full shadow-sm">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="px-3 py-1 bg-[#C9A24B] text-[#2A0A0F] text-[10px] tracking-elegant uppercase font-bold rounded-full shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
            wishlisted
              ? "bg-[#8B1E3E] text-[#FBF6EC] scale-110"
              : "bg-white/95 backdrop-blur-sm text-[#8B1E3E] hover:bg-[#8B1E3E] hover:text-[#FBF6EC] hover:scale-110"
          )}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} className={wishlisted ? "fill-current" : ""} />
        </button>

        {/* Desktop: hover overlay with Add to Cart + Buy Now */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className={cn(
                "flex-1 py-2.5 backdrop-blur-md text-xs tracking-elegant uppercase font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 shadow-lg",
                added ? "bg-[#5C8C3E] text-white" : "bg-[#2A0A0F]/90 text-[#FBF6EC] hover:bg-[#8B1E3E]"
              )}
            >
              {added ? <><Check size={14} /> Added!</> : <><ShoppingBag size={14} /> Add to Cart</>}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 py-2.5 bg-[#25D366]/95 backdrop-blur-md text-white text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-all flex items-center justify-center gap-1.5 shadow-lg"
            >
              <MessageCircle size={14} /> Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 text-center flex-1 flex flex-col">
        <p className="text-[10px] tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5">
          {product.category}
        </p>
        <button
          onClick={() => openProduct(product.slug)}
          className="block w-full"
        >
          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#2A0A0F] hover:text-[#8B1E3E] transition-colors leading-tight line-clamp-2">
            {product.name}
          </h3>
        </button>
        <p className="text-xs text-[#6B5544] mt-1.5 line-clamp-1 flex-1">
          {product.shortDescription}
        </p>

        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-lg font-bold text-[#8B1E3E]">
            {formatINR(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-[#6B5544] line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Mobile: always-visible Add to Cart + Buy Now buttons */}
        <div className="md:hidden mt-3 flex gap-2">
          <button
            onClick={handleAddToCart}
            className={cn(
              "flex-1 py-2.5 text-xs tracking-elegant uppercase font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
              added ? "bg-[#5C8C3E] text-white" : "bg-[#2A0A0F] text-[#FBF6EC] hover:bg-[#8B1E3E]"
            )}
          >
            {added ? <><Check size={14} /> Added!</> : <><Plus size={14} /> Add</>}
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 py-2.5 bg-[#25D366] text-white text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-all flex items-center justify-center gap-1.5"
          >
            <MessageCircle size={14} /> Buy
          </button>
        </div>
      </div>
    </motion.div>
  )
}
