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

// Navigation state snapshot for history
type NavState = {
  view: View
  selectedProductSlug: string | null
  selectedCategory: string | null
  searchQuery: string
  infoPageId: InfoPageId | null
}

type StoreState = NavState & {
  // Navigation history
  navHistory: NavState[]
  canGoBack: boolean

  // Cart
  cart: CartItem[]
  isCartOpen: boolean

  // Wishlist
  wishlist: WishlistItem[]

  // Recently viewed products
  recentlyViewed: WishlistItem[]

  // Quick View
  quickViewProduct: any | null

  // Admin
  isAdminOpen: boolean
  isAdminPanelOpen: boolean

  // UI
  isMenuOpen: boolean

  // Actions
  setView: (v: View) => void
  openProduct: (slug: string) => void
  setCategory: (cat: string | null) => void
  setSearchQuery: (q: string) => void
  openInfo: (id: InfoPageId) => void
  goBack: () => void
  goHome: () => void

  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void

  toggleWishlist: (item: WishlistItem) => void
  removeFromWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean

  addToRecentlyViewed: (item: WishlistItem) => void

  setQuickView: (product: any | null) => void

  setAdminOpen: (open: boolean) => void
  setAdminPanelOpen: (open: boolean) => void
  setMenuOpen: (open: boolean) => void
}

// Helper: get current nav state as snapshot
function getNavState(state: StoreState): NavState {
  return {
    view: state.view,
    selectedProductSlug: state.selectedProductSlug,
    selectedCategory: state.selectedCategory,
    searchQuery: state.searchQuery,
    infoPageId: state.infoPageId,
  }
}

// Helper: navigate to a new state (pushes current to history)
function navigate(set: any, get: any, newState: Partial<NavState>) {
  const current = getNavState(get())
  // Don't push duplicate states (e.g. clicking same category twice)
  const isSame =
    current.view === newState.view &&
    current.selectedProductSlug === (newState.selectedProductSlug ?? current.selectedProductSlug) &&
    current.selectedCategory === (newState.selectedCategory ?? current.selectedCategory) &&
    current.searchQuery === (newState.searchQuery ?? current.searchQuery) &&
    current.infoPageId === (newState.infoPageId ?? current.infoPageId)
  if (isSame) return

  set({
    ...newState,
    navHistory: [...get().navHistory, current],
    canGoBack: true,
    isMenuOpen: false,
  })
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" })
    // Push to browser history so browser back button works
    try {
      window.history.pushState({ nav: true }, "")
    } catch {}
  }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      view: "home",
      selectedProductSlug: null,
      selectedCategory: null,
      searchQuery: "",
      infoPageId: null,

      navHistory: [],
      canGoBack: false,

      cart: [],
      isCartOpen: false,

      wishlist: [],

      recentlyViewed: [],

      quickViewProduct: null,

      isAdminOpen: false,
      isAdminPanelOpen: false,
      isMenuOpen: false,

      setView: (v) => navigate(set, get, { view: v }),
      openProduct: (slug) => navigate(set, get, { view: "product", selectedProductSlug: slug }),
      setCategory: (cat) => navigate(set, get, { view: "shop", selectedCategory: cat, searchQuery: "" }),
      setSearchQuery: (q) => navigate(set, get, { view: q ? "search" : "shop", searchQuery: q }),
      openInfo: (id) => navigate(set, get, { view: "info", infoPageId: id }),

      goBack: () => {
        const history = get().navHistory
        if (history.length === 0) {
          // Nothing to go back to — try browser back, or stay on home
          if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back()
          }
          return
        }
        const prev = history[history.length - 1]
        set({
          ...prev,
          navHistory: history.slice(0, -1),
          canGoBack: history.length > 1,
          isMenuOpen: false,
        })
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      },

      goHome: () => {
        set({
          view: "home",
          selectedProductSlug: null,
          selectedCategory: null,
          searchQuery: "",
          infoPageId: null,
          navHistory: [],
          canGoBack: false,
          isMenuOpen: false,
        })
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      },

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
        // Don't auto-open cart drawer — just add silently
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

      addToRecentlyViewed: (item) => {
        const existing = get().recentlyViewed.filter((r) => r.productId !== item.productId)
        set({ recentlyViewed: [item, ...existing].slice(0, 8) })
      },

      setQuickView: (product) => set({ quickViewProduct: product }),

      setAdminOpen: (open) => set({ isAdminOpen: open }),
      setAdminPanelOpen: (open) => set({ isAdminPanelOpen: open }),
      setMenuOpen: (open) => set({ isMenuOpen: open }),
    }),
    {
      name: "house-of-neelam-store",
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist, recentlyViewed: state.recentlyViewed }),
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
