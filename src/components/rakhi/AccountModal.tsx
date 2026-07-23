"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { signIn } from "next-auth/react"
import {
  X, User, Heart, ShoppingBag, Package, Settings, LogOut, ChevronRight,
  Mail, Lock, Phone, UserPlus, Loader2, CheckCircle2, Clock, Truck
} from "lucide-react"
import { formatINR } from "@/lib/utils"

export function AccountModal() {
  const { isAdminOpen, setAdminOpen, setAdminPanelOpen, cart, wishlist, setView } = useStore()
  const { data: session } = useSession()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Signup form state
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPhone, setSignupPhone] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState("")
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    if (isAdminOpen && session && !isAdmin) {
      // Fetch customer's orders
      setLoadingOrders(true)
      fetch("/api/user/orders")
        .then((r) => r.json())
        .then((d) => setOrders(d.orders || []))
        .catch(() => {})
        .finally(() => setLoadingOrders(false))
    }
  }, [isAdminOpen, session, isAdmin])

  if (!isAdminOpen) return null

  const handleClose = () => {
    setAdminOpen(false)
    setSignupError("")
    setLoginError("")
    setSignupSuccess(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        setSignupSuccess(true)
        // Auto-login after signup
        await signIn("credentials", {
          email: signupEmail,
          password: signupPassword,
          redirect: false,
        })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setSignupError(data.error || "Signup failed")
      }
    } catch (e: any) {
      setSignupError(e.message || "Network error")
    } finally {
      setSignupLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })

    if (res?.error) {
      setLoginError("Invalid email or password. If you're a new customer, please sign up first.")
      setLoginLoading(false)
    } else {
      await new Promise((r) => setTimeout(r, 500))
      window.location.reload()
    }
  }

  const handleGuestContinue = () => {
    handleClose()
  }

  const orderStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Pending", color: "text-[#C9A24B]", icon: Clock },
    CONFIRMED: { label: "Confirmed", color: "text-[#5C8C3E]", icon: CheckCircle2 },
    SHIPPED: { label: "Shipped", color: "text-[#8B1E3E]", icon: Truck },
    DELIVERED: { label: "Delivered", color: "text-[#5C8C3E]", icon: Package },
    CANCELLED: { label: "Cancelled", color: "text-[#B3324A]", icon: X },
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
            // ─── Not logged in — show Login/Signup tabs ───────────────────
            <div className="p-6">
              {/* Tab switcher */}
              <div className="flex gap-2 mb-6 p-1 bg-[var(--cream)] rounded-lg">
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    mode === "login" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted-foreground)]"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    mode === "signup" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted-foreground)]"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {mode === "login" ? (
                // ─── Login Form ────────────────────────────────────────────
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Welcome Back</h2>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Sign in to track your orders</p>
                  </div>

                  <div>
                    <label className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] rounded-md text-sm bg-white outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] rounded-md text-sm bg-white outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="px-3 py-2 bg-[#B3324A]/10 text-[#B3324A] text-sm rounded-md">{loginError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-[var(--primary)] text-white text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loginLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign In"}
                  </button>

                  {/* Guest option */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border)]"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[var(--background)] px-3 text-xs text-[var(--muted-foreground)]">or</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGuestContinue}
                    className="w-full py-3 border border-[var(--border)] text-[var(--foreground)] text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[var(--cream)] transition-colors"
                  >
                    Continue as Guest
                  </button>
                  <p className="text-xs text-[var(--muted-foreground)] text-center">
                    Browse and order via WhatsApp without creating an account
                  </p>
                </form>
              ) : signupSuccess ? (
                // ─── Signup Success ────────────────────────────────────────
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#5C8C3E]/10 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-[#5C8C3E]" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-[var(--foreground)] mb-2">Account Created!</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Signing you in...</p>
                  <Loader2 size={20} className="animate-spin text-[var(--primary)] mx-auto mt-4" />
                </div>
              ) : (
                // ─── Signup Form ───────────────────────────────────────────
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                      <UserPlus size={24} className="text-white" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Create Account</h2>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Track orders and save your favorites</p>
                  </div>

                  <div>
                    <label className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] rounded-md text-sm bg-white outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] rounded-md text-sm bg-white outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1.5 block">Phone (optional)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] rounded-md text-sm bg-white outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs tracking-wide uppercase text-[var(--accent)] font-semibold mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-3 py-2.5 border border-[var(--border)] rounded-md text-sm bg-white outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  {signupError && (
                    <div className="px-3 py-2 bg-[#B3324A]/10 text-[#B3324A] text-sm rounded-md">{signupError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full py-3 bg-[var(--primary)] text-white text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {signupLoading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          ) : isAdmin ? (
            // ─── Admin logged in ──────────────────────────────────────────
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                  <Settings size={28} className="text-[var(--accent)]" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Management Portal</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{session.user?.email}</p>
              </div>

              <button
                onClick={() => { setAdminOpen(false); setTimeout(() => setAdminPanelOpen(true), 100) }}
                className="w-full py-3 bg-[var(--primary)] text-white text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Settings size={16} /> Open Admin Panel
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/", redirect: false })}
                className="w-full py-3 border border-[var(--border)] text-[var(--foreground)] text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[var(--cream)] transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            // ─── Customer logged in — full account section ────────────────
            <div className="p-6">
              {/* Profile header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                  <User size={28} className="text-white" />
                </div>
                <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">
                  {session.user?.name || "My Account"}
                </h2>
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

              {/* Order History */}
              <div className="mb-4">
                <h3 className="text-sm tracking-wide uppercase text-[var(--accent)] font-bold mb-3 flex items-center gap-2">
                  <Package size={16} /> Order History
                </h3>

                {loadingOrders ? (
                  <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[var(--primary)]" /></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-6 bg-[var(--cream)] rounded-lg">
                    <Package size={32} className="mx-auto text-[var(--muted-foreground)] mb-2" />
                    <p className="text-sm text-[var(--muted-foreground)]">No orders yet</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Your WhatsApp orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {orders.map((order) => {
                      const status = orderStatusConfig[order.status] || orderStatusConfig.PENDING
                      const StatusIcon = status.icon
                      return (
                        <div key={order.id} className="p-3 bg-[var(--cream)] rounded-lg border border-[var(--border)]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[var(--muted-foreground)]">{order.orderNumber}</span>
                            <span className={`text-xs font-semibold flex items-center gap-1 ${status.color}`}>
                              <StatusIcon size={12} /> {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.items?.slice(0, 3).map((item: any, i: number) => (
                              <img key={i} src={item.image} alt="" className="w-10 h-10 rounded object-cover" />
                            ))}
                            {order.items?.length > 3 && (
                              <span className="text-xs text-[var(--muted-foreground)]">+{order.items.length - 3} more</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="text-sm font-bold text-[var(--primary)]">{formatINR(order.total)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div className="space-y-1 mb-4">
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
              </div>

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/", redirect: false })}
                className="w-full py-3 border border-[var(--border)] text-[var(--foreground)] text-sm tracking-wide uppercase font-semibold rounded-md hover:bg-[var(--cream)] transition-colors flex items-center justify-center gap-2"
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
