"use client"

import { useStore } from "@/lib/store"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/rakhi/Header"
import { Footer } from "@/components/rakhi/Footer"
import { HomeView } from "@/components/rakhi/HomeView"
import { ShopView } from "@/components/rakhi/ShopView"
import { ProductView } from "@/components/rakhi/ProductView"
import { CartView } from "@/components/rakhi/CartView"
import { WishlistView } from "@/components/rakhi/WishlistView"
import { InfoPage } from "@/components/rakhi/InfoPage"
import { CartDrawer } from "@/components/rakhi/CartDrawer"
import { AdminView } from "@/components/rakhi/AdminView"
import { FloatingActions } from "@/components/rakhi/FloatingActions"
import { BackButton, BrowserHistorySync } from "@/components/rakhi/BackButton"
import { useEffect } from "react"

const pageTransitions = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
}

export default function Home() {
  const { view, infoPageId, isAdminOpen } = useStore()

  // Scroll to top on view change (handled in store too, but as backup)
  useEffect(() => {
    if (!isAdminOpen) window.scrollTo({ top: 0, behavior: "smooth" })
  }, [view, isAdminOpen])

  // Don't render storefront when admin is open
  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-[#FBF6EC]">
        <AdminView />
        <BrowserHistorySync />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BrowserHistorySync />
      <Header />
      <BackButton />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={view} {...pageTransitions}>
            {view === "home" && <HomeView />}
            {view === "shop" && <ShopView />}
            {view === "search" && <ShopView />}
            {view === "product" && <ProductView />}
            {view === "cart" && <CartView />}
            {view === "wishlist" && <WishlistView />}
            {view === "info" && <InfoPage pageId={infoPageId || "about"} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />

      {/* Overlays */}
      <CartDrawer />
      <AdminView />
      <FloatingActions />
    </div>
  )
}
