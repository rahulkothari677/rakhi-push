"use client"

import { useStore } from "@/lib/store"
import { Heart, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatINR } from "@/lib/utils"

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative bg-white rounded-lg overflow-hidden shadow-luxe hover:shadow-luxe-hover transition-all duration-500 hover-lift border border-[#E8D9B8]/60"
    >
      {/* Image */}
      <button
        onClick={() => openProduct(product.slug)}
        className="block w-full aspect-square overflow-hidden bg-[#FBF6EC] relative"
      >
        <img
          src={product.primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
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
      </button>

      {/* Wishlist heart */}
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
          "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
          wishlisted
            ? "bg-[#8B1E3E] text-[#FBF6EC]"
            : "bg-white/90 text-[#8B1E3E] hover:bg-[#8B1E3E] hover:text-[#FBF6EC]"
        )}
        aria-label="Toggle wishlist"
      >
        <Heart size={16} className={wishlisted ? "fill-current" : ""} />
      </button>

      {/* Quick add to cart on hover */}
      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
        <button
          onClick={() =>
            addToCart({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: product.primaryImage,
              price: product.price,
              quantity: 1,
              sku: product.sku,
            })
          }
          className="w-full py-2.5 bg-[#2A0A0F]/95 backdrop-blur-sm text-[#FBF6EC] text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[#8B1E3E] transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag size={14} /> Quick Add
        </button>
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5 text-center">
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
        <p className="text-xs text-[#6B5544] mt-1.5 line-clamp-1">
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
      </div>
    </motion.div>
  )
}
