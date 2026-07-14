"use client"

import { useStore } from "@/lib/store"
import { Heart, ShoppingBag, MessageCircle, Plus, Check } from "lucide-react"
import { motion } from "framer-motion"
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
      className="group relative bg-card rounded-xl overflow-hidden shadow-luxe hover:shadow-luxe-hover transition-all duration-500 hover-lift border border-border/60 flex flex-col"
    >
      {/* Image — takes ~75% of card height (Myntra style) */}
      <div
        onClick={() => openProduct(product.slug)}
        className="block w-full aspect-[4/5] overflow-hidden bg-muted relative cursor-pointer"
      >
        <img
          src={productImage(product.primaryImage)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        {/* No dark overlay — images stay vibrant */}

        {/* Badges — top left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.badge && (
            <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[9px] tracking-elegant uppercase font-semibold rounded-full shadow-sm">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="px-2.5 py-1 bg-accent text-accent-foreground text-[9px] tracking-elegant uppercase font-bold rounded-full shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Action icons — top right (wishlist + add to cart + buy) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          {/* Wishlist heart */}
          <button
            onClick={handleWishlist}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
              wishlisted
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-card/95 backdrop-blur-sm text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110"
            )}
            aria-label="Toggle wishlist"
          >
            <Heart size={14} className={wishlisted ? "fill-current" : ""} />
          </button>

          {/* Add to cart icon */}
          <button
            onClick={handleAddToCart}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
              added
                ? "bg-[#5C8C3E] text-white scale-110"
                : "bg-card/95 backdrop-blur-sm text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110"
            )}
            aria-label="Add to cart"
          >
            {added ? <Check size={14} /> : <ShoppingBag size={14} />}
          </button>

          {/* Buy on WhatsApp icon */}
          <button
            onClick={handleBuyNow}
            className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-[#1FAE54] hover:scale-110 transition-all duration-300 shadow-sm"
            aria-label="Buy on WhatsApp"
          >
            <MessageCircle size={14} className="fill-current" />
          </button>
        </div>

        {/* Desktop: hover overlay with larger buttons */}
        <div className="hidden md:flex absolute inset-x-0 bottom-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 gap-2">
          <button
            onClick={handleAddToCart}
            className={cn(
              "flex-1 h-9 backdrop-blur-md text-[10px] tracking-elegant uppercase font-semibold rounded-md transition-all flex items-center justify-center gap-1 shadow-lg",
              added ? "bg-[#5C8C3E] text-white" : "bg-foreground/90 text-background hover:bg-primary"
            )}
            aria-label="Add to cart"
          >
            {added ? <Check size={13} /> : <ShoppingBag size={13} />} {added ? "Added!" : "Add"}
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 h-9 bg-[#25D366]/95 backdrop-blur-md text-white text-[10px] tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-all flex items-center justify-center gap-1 shadow-lg"
            aria-label="Buy on WhatsApp"
          >
            <MessageCircle size={13} /> Buy
          </button>
        </div>
      </div>

      {/* Info — compact text section (~25% of card, Myntra style) */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Brand/Category — small uppercase */}
        <p className="text-[9px] tracking-elegant uppercase text-accent font-semibold mb-0.5 truncate">
          {product.category}
        </p>
        {/* Product name — 2 lines max */}
        <button
          onClick={() => openProduct(product.slug)}
          className="block w-full text-left"
        >
          <h3 className="font-serif text-sm font-semibold text-foreground hover:text-primary transition-colors leading-tight line-clamp-2 mb-1">
            {product.name}
          </h3>
        </button>
        {/* Price — compact */}
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-sm font-bold text-primary">
            {formatINR(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
          {discount > 0 && (
            <span className="text-[10px] text-accent font-semibold">
              {discount}% off
            </span>
          )}
        </div>

        {/* Mobile: small text hints for icons */}
        <div className="md:hidden mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Heart size={9} /> Wishlist</span>
          <span className="flex items-center gap-0.5"><ShoppingBag size={9} /> Cart</span>
          <span className="flex items-center gap-0.5 text-[#25D366] font-semibold"><MessageCircle size={9} className="fill-current" /> Buy</span>
        </div>
      </div>
    </motion.div>
  )
}
