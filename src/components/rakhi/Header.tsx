"use client"

import { useStore } from "@/lib/store"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Menu, X, ShoppingBag, Heart, Search, User, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { categoryThumbnail } from "@/lib/images"
import { motion, AnimatePresence } from "framer-motion"

type Category = {
  id: string
  name: string
  slug: string
  icon?: string | null
  image?: string | null
  productCount: number
}

export function Header() {
  const {
    view,
    setView,
    setMenuOpen,
    isMenuOpen,
    cart,
    wishlist,
    setCartOpen,
    setCategory,
    setSearchQuery,
    isAdminOpen,
    setAdminOpen,
  } = useStore()
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [showCategories, setShowCategories] = useState(false)
  const [announcement, setAnnouncement] = useState<{ enabled: boolean; text: string } | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setAnnouncement(d.settings?.announcement))
      .catch(() => {})
  }, [])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  const navToCategory = (cat: string) => {
    setCategory(cat)
    setShowCategories(false)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Announcement bar */}
      {announcement?.enabled && (
        <div className="bg-gradient-to-r from-[#8B1E3E] via-[#A8425B] to-[#8B1E3E] text-[#FBF6EC] text-xs sm:text-sm py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex">
            <span className="mx-8">{announcement.text}</span>
            <span className="mx-8">{announcement.text}</span>
            <span className="mx-8">{announcement.text}</span>
            <span className="mx-8">{announcement.text}</span>
          </div>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[#FBF6EC]/95 backdrop-blur-md shadow-luxe"
            : "bg-[#FBF6EC]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-[#8B1E3E]"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <button
              onClick={() => setView("home")}
              className="flex flex-col items-center group"
            >
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#8B1E3E] leading-none tracking-tight group-hover:text-[#6B0E2A] transition-colors">
                House of <span className="text-gradient-gold italic">Neelam</span>
              </span>
              <span className="text-[10px] sm:text-xs tracking-[0.3em] text-[#C9A24B] uppercase mt-1 font-medium">
                Rakhi Collection
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => setView("home")}
                className={cn(
                  "text-sm tracking-elegant uppercase font-medium hover:text-[#8B1E3E] transition-colors",
                  view === "home" ? "text-[#8B1E3E]" : "text-[#2A0A0F]"
                )}
              >
                Home
              </button>

              {/* Categories dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
              >
                <button
                  onClick={() => setView("shop")}
                  className={cn(
                    "text-sm tracking-elegant uppercase font-medium hover:text-[#8B1E3E] transition-colors flex items-center gap-1",
                    view === "shop" ? "text-[#8B1E3E]" : "text-[#2A0A0F]"
                  )}
                >
                  Collection <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {showCategories && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] bg-white shadow-luxe-hover rounded-lg border border-[#E8D9B8] p-6 grid grid-cols-3 gap-4"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => navToCategory(cat.name)}
                          className="flex items-start gap-3 p-3 rounded-md hover:bg-[#FBF6EC] transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-[#F4EAD5] flex-shrink-0">
                            {cat.image ? (
                              <img src={categoryThumbnail(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#8B1E3E] font-serif font-bold text-lg">
                                {cat.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#2A0A0F] group-hover:text-[#8B1E3E]">
                              {cat.name}
                            </div>
                            <div className="text-xs text-[#6B5544] mt-0.5">
                              {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setView("shop")
                          setShowCategories(false)
                        }}
                        className="col-span-3 mt-2 py-2 text-center text-sm tracking-elegant uppercase font-medium text-[#8B1E3E] hover:bg-[#FBF6EC] rounded-md transition-colors border-t border-[#E8D9B8]"
                      >
                        View All Collection →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setView("info") || useStore.setState({ infoPageId: "about" })}
                className="text-sm tracking-elegant uppercase font-medium text-[#2A0A0F] hover:text-[#8B1E3E] transition-colors"
              >
                Our Story
              </button>

              <button
                onClick={() => setView("info") || useStore.setState({ infoPageId: "contact" })}
                className="text-sm tracking-elegant uppercase font-medium text-[#2A0A0F] hover:text-[#8B1E3E] transition-colors"
              >
                Contact
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <form onSubmit={onSearch} className="hidden md:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search Rakhis..."
                    className="w-0 group-hover:w-48 focus:w-48 transition-all duration-300 bg-transparent border-b border-transparent focus:border-[#C9A24B] outline-none py-1 pl-7 pr-2 text-sm text-[#2A0A0F] placeholder:text-[#6B5544]"
                  />
                  <Search
                    size={16}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B5544] pointer-events-none"
                  />
                </div>
              </form>

              <button
                onClick={() => setView("wishlist")}
                className="relative p-2 text-[#2A0A0F] hover:text-[#8B1E3E] transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#8B1E3E] text-[#FBF6EC] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold animate-badge-pop">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-[#2A0A0F] hover:text-[#8B1E3E] transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#C9A24B] text-[#2A0A0F] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold animate-badge-pop">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Admin button */}
              {session ? (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 ml-1 bg-[#8B1E3E] text-[#FBF6EC] text-xs tracking-elegant uppercase font-medium rounded-md hover:bg-[#6B0E2A] transition-colors"
                >
                  <Sparkles size={14} /> Admin
                </button>
              ) : (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="p-2 text-[#2A0A0F] hover:text-[#8B1E3E] transition-colors"
                  aria-label="Admin login"
                >
                  <User size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#FBF6EC] border-t border-[#E8D9B8] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                <form onSubmit={onSearch} className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search Rakhis..."
                      className="w-full bg-white border border-[#E8D9B8] rounded-md py-2 pl-9 pr-3 text-sm outline-none focus:border-[#C9A24B]"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5544]" />
                  </div>
                </form>
                <button
                  onClick={() => setView("home")}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-[#2A0A0F] hover:bg-white rounded-md"
                >
                  Home
                </button>
                <button
                  onClick={() => setView("shop")}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-[#2A0A0F] hover:bg-white rounded-md"
                >
                  All Collection
                </button>
                <div className="px-3 py-1 text-xs tracking-elegant uppercase text-[#6B5544] font-semibold">
                  Categories
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navToCategory(cat.name)}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#2A0A0F] hover:bg-white rounded-md"
                    >
                      <div className="w-7 h-7 rounded overflow-hidden bg-[#F4EAD5] flex-shrink-0">
                        {cat.image ? (
                          <img src={categoryThumbnail(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8B1E3E] font-serif font-bold text-sm">
                            {cat.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {cat.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    useStore.setState({ infoPageId: "about" })
                    setView("info")
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-[#2A0A0F] hover:bg-white rounded-md"
                >
                  Our Story
                </button>
                <button
                  onClick={() => {
                    useStore.setState({ infoPageId: "contact" })
                    setView("info")
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-[#2A0A0F] hover:bg-white rounded-md"
                >
                  Contact
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
