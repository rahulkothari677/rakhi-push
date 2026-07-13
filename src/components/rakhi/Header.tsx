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
  const [showSearch, setShowSearch] = useState(false)
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
    setShowSearch(false)
  }

  const navToCategory = (cat: string) => {
    setCategory(cat)
    setShowCategories(false)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Announcement bar — premium gradient */}
      {announcement?.enabled && (
        <div className="bg-gradient-to-r from-[#6B0E2A] via-[#8B1E3E] to-[#6B0E2A] text-[#FBF6EC] text-xs sm:text-sm py-2 overflow-hidden border-b border-[#C9A24B]/30">
          <div className="animate-marquee whitespace-nowrap flex">
            <span className="mx-8 flex items-center gap-2">✨ {announcement.text} ✨</span>
            <span className="mx-8 flex items-center gap-2">✨ {announcement.text} ✨</span>
            <span className="mx-8 flex items-center gap-2">✨ {announcement.text} ✨</span>
            <span className="mx-8 flex items-center gap-2">✨ {announcement.text} ✨</span>
          </div>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_4px_30px_rgba(139,30,62,0.08)] border-b border-[#E8D9B8]"
            : "bg-gradient-to-b from-[#FBF6EC] to-[#FBF6EC]/95 border-b border-[#E8D9B8]/50"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-[#8B1E3E] hover:bg-[#F4EAD5] rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo — premium design */}
            <button
              onClick={() => useStore.getState().goHome()}
              className="flex flex-col items-center group"
            >
              <div className="flex items-center gap-2">
                {/* Decorative ornament */}
                <span className="text-[#C9A24B] text-lg hidden sm:block">❖</span>
                <span className="font-serif text-2xl sm:text-3xl font-bold leading-none tracking-tight">
                  <span className="text-[#2A0A0F]">House of </span>
                  <span className="text-gradient-gold italic">Neelam</span>
                </span>
                <span className="text-[#C9A24B] text-lg hidden sm:block">❖</span>
              </div>
              <span className="text-[10px] sm:text-xs tracking-[0.3em] text-[#8B1E3E] uppercase mt-1.5 font-semibold">
                ✦ Rakhi Collection ✦
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => useStore.getState().goHome()}
                className={cn(
                  "px-4 py-2 text-sm tracking-elegant uppercase font-medium rounded-md transition-all",
                  view === "home" ? "text-[#8B1E3E] bg-[#F4EAD5]" : "text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5]/50"
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
                    "px-4 py-2 text-sm tracking-elegant uppercase font-medium rounded-md transition-all flex items-center gap-1",
                    view === "shop" || view === "search" ? "text-[#8B1E3E] bg-[#F4EAD5]" : "text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5]/50"
                  )}
                >
                  Collection <ChevronDown size={14} className={cn("transition-transform", showCategories && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showCategories && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] bg-white shadow-[0_20px_60px_rgba(139,30,62,0.15)] rounded-xl border border-[#E8D9B8] p-6 grid grid-cols-3 gap-2"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => navToCategory(cat.name)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#FBF6EC] transition-all text-left group"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F4EAD5] flex-shrink-0 ring-2 ring-transparent group-hover:ring-[#C9A24B] transition-all">
                            {cat.image ? (
                              <img src={categoryThumbnail(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#8B1E3E] font-serif font-bold text-xl">
                                {cat.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#2A0A0F] group-hover:text-[#8B1E3E] transition-colors">
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
                        className="col-span-3 mt-2 py-3 text-center text-sm tracking-elegant uppercase font-semibold text-[#8B1E3E] hover:bg-[#FBF6EC] rounded-lg transition-colors border-t border-[#E8D9B8]"
                      >
                        View All Collection →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => { useStore.setState({ infoPageId: "about" }); setView("info") }}
                className="px-4 py-2 text-sm tracking-elegant uppercase font-medium text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5]/50 rounded-md transition-all"
              >
                Our Story
              </button>

              <button
                onClick={() => { useStore.setState({ infoPageId: "contact" }); setView("info") }}
                className="px-4 py-2 text-sm tracking-elegant uppercase font-medium text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5]/50 rounded-md transition-all"
              >
                Contact
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2.5 text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5] rounded-md transition-all"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <button
                onClick={() => setView("wishlist")}
                className="relative p-2.5 text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5] rounded-md transition-all"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#8B1E3E] text-[#FBF6EC] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold animate-badge-pop">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5] rounded-md transition-all"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#C9A24B] text-[#2A0A0F] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-badge-pop">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Admin button */}
              {session ? (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 ml-1 bg-gradient-to-r from-[#8B1E3E] to-[#6B0E2A] text-[#FBF6EC] text-xs tracking-elegant uppercase font-semibold rounded-md hover:shadow-lg transition-all"
                >
                  <Sparkles size={14} /> Admin
                </button>
              ) : (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="p-2.5 text-[#2A0A0F] hover:text-[#8B1E3E] hover:bg-[#F4EAD5] rounded-md transition-all"
                  aria-label="Admin login"
                >
                  <User size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search bar — expandable */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border-t border-[#E8D9B8]"
            >
              <form onSubmit={onSearch} className="max-w-3xl mx-auto px-4 py-4">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B5544]" />
                  <input
                    type="text"
                    autoFocus
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search for Rakhis, categories..."
                    className="w-full pl-12 pr-4 py-3 bg-[#FBF6EC] border border-[#E8D9B8] rounded-lg text-sm outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#8B1E3E] text-[#FBF6EC] text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-[#E8D9B8] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
                <form onSubmit={onSearch} className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search Rakhis..."
                      className="w-full bg-[#FBF6EC] border border-[#E8D9B8] rounded-md py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#C9A24B]"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5544]" />
                  </div>
                </form>
                <button
                  onClick={() => useStore.getState().goHome()}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#2A0A0F] hover:bg-[#FBF6EC] rounded-md"
                >
                  Home
                </button>
                <button
                  onClick={() => setView("shop")}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#2A0A0F] hover:bg-[#FBF6EC] rounded-md"
                >
                  All Collection
                </button>
                <div className="px-3 py-1 text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold">
                  Collections
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navToCategory(cat.name)}
                      className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-[#2A0A0F] hover:bg-[#FBF6EC] rounded-md"
                    >
                      <div className="w-8 h-8 rounded overflow-hidden bg-[#F4EAD5] flex-shrink-0">
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
                <div className="divider-gold my-3" />
                <button
                  onClick={() => { useStore.setState({ infoPageId: "about" }); setView("info") }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#2A0A0F] hover:bg-[#FBF6EC] rounded-md"
                >
                  Our Story
                </button>
                <button
                  onClick={() => { useStore.setState({ infoPageId: "contact" }); setView("info") }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#2A0A0F] hover:bg-[#FBF6EC] rounded-md"
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
