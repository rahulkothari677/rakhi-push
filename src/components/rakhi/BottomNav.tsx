"use client"

import { useStore, getCartCount } from "@/lib/store"
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function BottomNav() {
  const { view, setView, setCartOpen, cart, wishlist, setAdminOpen } = useStore()

  const cartCount = getCartCount(cart)

  const tabs = [
    { id: "home", label: "Home", icon: Home, action: () => useStore.getState().goHome() },
    { id: "shop", label: "Shop", icon: Search, action: () => setView("shop") },
    { id: "wishlist", label: "Wishlist", icon: Heart, action: () => setView("wishlist"), badge: wishlist.length },
    { id: "cart", label: "Cart", icon: ShoppingBag, action: () => setCartOpen(true), badge: cartCount },
    { id: "account", label: "Account", icon: User, action: () => setAdminOpen(true) },
  ]

  return (
    <>
      {/* Bottom nav — mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--border)] shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = view === tab.id || (tab.id === "home" && view === "home")
            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute -top-px h-1 w-8 rounded-full bg-[var(--primary)]"
                  />
                )}
                <div className="relative">
                  <tab.icon size={20} className={isActive ? "fill-current" : ""} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[var(--primary)] text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium tracking-wide">{tab.label}</span>
              </button>
            )
          })}
        </div>
        {/* Safe area padding for iPhone notch */}
        <div className="h-safe pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav on mobile */}
      <div className="lg:hidden h-16" />
    </>
  )
}
