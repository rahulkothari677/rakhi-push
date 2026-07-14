"use client"

import { toast } from "sonner"
import { Check, Heart, ShoppingBag } from "lucide-react"

// Toast helpers for user actions — haptic feedback feel like Myntra/Ajio

export function showAddedToCart(productName?: string) {
  // Haptic feedback (mobile)
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(50)
  }

  toast.success("Added to Cart!", {
    description: productName ? productName.slice(0, 40) + (productName.length > 40 ? "..." : "") : "Item added to your cart",
    duration: 2500,
    icon: <ShoppingBag size={18} className="text-white" />,
    style: {
      background: "var(--primary)",
      color: "white",
      border: "none",
    },
  })
}

export function showAddedToWishlist(productName?: string) {
  // Haptic feedback (mobile)
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(30)
  }

  toast.success("Added to Wishlist!", {
    description: productName ? productName.slice(0, 40) + (productName.length > 40 ? "..." : "") : "Item saved to your wishlist",
    duration: 2500,
    icon: <Heart size={18} className="text-white fill-current" />,
    style: {
      background: "var(--primary)",
      color: "white",
      border: "none",
    },
  })
}

export function showRemovedFromWishlist(productName?: string) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(30)
  }

  toast("Removed from Wishlist", {
    description: productName ? productName.slice(0, 40) + (productName.length > 40 ? "..." : "") : undefined,
    duration: 2000,
    style: {
      background: "var(--cream)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
    },
  })
}

export function showOrderSent(total: string) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([50, 30, 50])
  }

  toast.success("Order Sent! 🎉", {
    description: `Total: ${total} — Check WhatsApp to complete your order`,
    duration: 4000,
    icon: <Check size={18} className="text-white" />,
    style: {
      background: "#25D366",
      color: "white",
      border: "none",
    },
  })
}
