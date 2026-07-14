"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Heart, ShoppingBag, Package, Settings, LogOut, ChevronRight, Sparkles, Phone, Mail, MapPin } from "lucide-react"
import { AdminLogin } from "./AdminLogin"
import { formatINR } from "@/lib/utils"
import { useEffect } from "react"

export function AccountModal() {
  const { isAdminOpen, setAdminOpen, setAdminPanelOpen, cart, wishlist, setView } = useStore()
  const { data: session } = useSession()
  const [showLogin, setShowLogin] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    if (isAdminOpen && session) {
      // Fetch orders for this user
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => setSettings(d.settings))
        .catch(() => {})
    }
  }, [isAdminOpen, session])

  if (!isAdminOpen) return null

  const isAdmin = session?.user?.role === "ADMIN"

  const handleClose = () => {
    setAdminOpen(false)
    setShowLogin(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--background)] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[var(--cream)] hover:bg-[var(--accent)]/20 flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {!session ? (
            // Not logged in — show admin login (for admin access only)
            <AdminLogin onClose={handleClose} />
          ) : isAdmin ? (
            // Admin logged in — show admin panel link
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                  <Sparkles size={28} className="text-[var(--accent)]" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Management Portal</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{session.user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setAdminOpen(false)
                  // Open admin panel
                  setTimeout(() => setAdminPanelOpen(true), 100)
                }}
                className="w-full py-3 bg-[var(--primary)] text-white text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Settings size={16} /> Open Admin Panel
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/", redirect: false })}
                className="w-full py-3 border border-[var(--border)] text-[var(--foreground)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--cream)] transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            // Regular user logged in — show account/profile
            <div className="p-6">
              {/* Profile header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                  <User size={28} className="text-white" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">My Account</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{session.user?.email}</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { handleClose(); setView("wishlist") }}
                  className="p-4 bg-[var(--cream)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-left"
                >
                  <Heart size={20} className="text-[var(--primary)] mb-2" />
                  <p className="text-2xl font-bold text-[var(--foreground)]">{wishlist.length}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Wishlist Items</p>
                </button>
                <button
                  onClick={() => { handleClose(); useStore.getState().setCartOpen(true) }}
                  className="p-4 bg-[var(--cream)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-left"
                >
                  <ShoppingBag size={20} className="text-[var(--primary)] mb-2" />
                  <p className="text-2xl font-bold text-[var(--foreground)]">{cart.reduce((s, c) => s + c.quantity, 0)}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Cart Items</p>
                </button>
              </div>

              {/* Menu items */}
              <div className="space-y-2">
                <button
                  onClick={() => { handleClose(); setView("wishlist") }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--cream)] transition-colors text-left"
                >
                  <Heart size={18} className="text-[var(--primary)]" />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">My Wishlist</span>
                  <ChevronRight size={16} className="text-[var(--muted-foreground)]" />
                </button>

                <button
                  onClick={() => { handleClose(); useStore.getState().setCartOpen(true) }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--cream)] transition-colors text-left"
                >
                  <ShoppingBag size={18} className="text-[var(--primary)]" />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">My Cart</span>
                  <ChevronRight size={16} className="text-[var(--muted-foreground)]" />
                </button>

                <div className="flex items-center gap-3 p-3 rounded-lg text-left">
                  <Package size={18} className="text-[var(--primary)]" />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">Order History</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Coming Soon</span>
                </div>

                {settings?.contact?.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg text-left">
                    <Phone size={18} className="text-[var(--primary)]" />
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)]">{settings.contact.phone}</span>
                  </div>
                )}

                {settings?.contact?.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg text-left">
                    <Mail size={18} className="text-[var(--primary)]" />
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">{settings.contact.email}</span>
                  </div>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/", redirect: false })}
                className="w-full mt-6 py-3 border border-[var(--border)] text-[var(--foreground)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--cream)] transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
