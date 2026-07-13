"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type View =
  | "home"
  | "shop"
  | "product"
  | "cart"
  | "wishlist"
  | "checkout"
  | "order-success"
  | "admin"
  | "info"
  | "search"

export type CartItem = {
  productId: string
  slug: string
  name: string
  image: string
  price: number
  quantity: number
  sku: string
}

export type WishlistItem = {
  productId: string
  slug: string
  name: string
  image: string
  price: number
  sku: string
}

export type InfoPageId =
  | "about"
  | "story"
  | "care"
  | "shipping"
  | "contact"
  | "privacy"
  | "terms"

type StoreState = {
  // Navigation
  view: View
  selectedProductSlug: string | null
  selectedCategory: string | null
  searchQuery: string
  infoPageId: InfoPageId | null

  // Cart
  cart: CartItem[]
  isCartOpen: boolean

  // Wishlist
  wishlist: WishlistItem[]

  // Admin
  isAdminOpen: boolean

  // UI
  isMenuOpen: boolean

  // Actions
  setView: (v: View) => void
  openProduct: (slug: string) => void
  setCategory: (cat: string | null) => void
  setSearchQuery: (q: string) => void
  openInfo: (id: InfoPageId) => void

  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void

  toggleWishlist: (item: WishlistItem) => void
  removeFromWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean

  setAdminOpen: (open: boolean) => void
  setMenuOpen: (open: boolean) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      view: "home",
      selectedProductSlug: null,
      selectedCategory: null,
      searchQuery: "",
      infoPageId: null,

      cart: [],
      isCartOpen: false,

      wishlist: [],

      isAdminOpen: false,
      isMenuOpen: false,

      setView: (v) => {
        set({ view: v, isMenuOpen: false })
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
      },
      openProduct: (slug) => {
        set({ selectedProductSlug: slug, view: "product", isMenuOpen: false })
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
      },
      setCategory: (cat) => set({ selectedCategory: cat, view: "shop" }),
      setSearchQuery: (q) => set({ searchQuery: q, view: q ? "search" : "shop" }),
      openInfo: (id) => set({ infoPageId: id, view: "info" }),

      addToCart: (item) => {
        const existing = get().cart.find((c) => c.productId === item.productId)
        if (existing) {
          set({
            cart: get().cart.map((c) =>
              c.productId === item.productId ? { ...c, quantity: c.quantity + item.quantity } : c
            ),
          })
        } else {
          set({ cart: [...get().cart, item] })
        }
        set({ isCartOpen: true })
      },
      removeFromCart: (productId) =>
        set({ cart: get().cart.filter((c) => c.productId !== productId) }),
      updateCartQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId)
          return
        }
        set({
          cart: get().cart.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
        })
      },
      clearCart: () => set({ cart: [] }),
      setCartOpen: (open) => set({ isCartOpen: open }),

      toggleWishlist: (item) => {
        const exists = get().wishlist.find((w) => w.productId === item.productId)
        if (exists) {
          set({ wishlist: get().wishlist.filter((w) => w.productId !== item.productId) })
        } else {
          set({ wishlist: [...get().wishlist, item] })
        }
      },
      removeFromWishlist: (productId) =>
        set({ wishlist: get().wishlist.filter((w) => w.productId !== productId) }),
      isWishlisted: (productId) => !!get().wishlist.find((w) => w.productId === productId),

      setAdminOpen: (open) => set({ isAdminOpen: open }),
      setMenuOpen: (open) => set({ isMenuOpen: open }),
    }),
    {
      name: "house-of-neelam-store",
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist }),
    }
  )
)

// Cart total helper
export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
