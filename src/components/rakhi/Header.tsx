"use client"

import { useStore } from "@/lib/store"
import { useSession, signOut } from "next-auth/react"
import { Menu, X, ShoppingBag, Heart, Search, User, ChevronDown, Loader2, Camera, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { categoryThumbnail } from "@/lib/images"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"

type Category = {
  id: string
  name: string
  slug: string
  icon?: string | null
  image?: string | null
  productCount: number
}

type SearchResult = {
  id: string
  name: string
  slug: string
  primaryImage: string
  price: number
  category: string
}

export function Header() {
  const {
    view, setView, setMenuOpen, isMenuOpen,
    cart, wishlist, setCartOpen, setCategory, setSearchQuery, setAdminOpen,
  } = useStore()
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [announcement, setAnnouncement] = useState<{ enabled: boolean; text: string } | null>(null)

  // Autocomplete state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Image search state
  const [imageSearchLoading, setImageSearchLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchInput.trim() || searchInput.length < 2) {
      setSearchResults([])
      setShowSuggestions(false)
      return
    }

    setSearchLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchInput)}&limit=6`)
        .then((r) => r.json())
        .then((d) => {
          setSearchResults(d.products || [])
          setShowSuggestions(true)
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchQuery(searchInput)
      setShowSearch(false)
      setShowSuggestions(false)
    }
  }

  const onSuggestionClick = (slug: string) => {
    setShowSuggestions(false)
    setShowSearch(false)
    setSearchInput("")
    useStore.getState().openProduct(slug)
  }

  const onImageSearch = async (file: File) => {
    setImageSearchLoading(true)
    const toastId = toast.loading("Analyzing your image…", {
      description: "Uploading and identifying the Rakhi",
      duration: Infinity,
    })
    try {
      // Validate file type & size client-side (5 MB max)
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file (JPEG, PNG, WebP, or GIF)")
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`)
      }

      // Step 1: Upload image to PUBLIC endpoint (no admin auth required)
      const fd = new FormData()
      fd.append("file", file)
      const uploadRes = await fetch("/api/ai/upload-search-image", { method: "POST", body: fd })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Image upload failed. Please try again.")
      }

      const imageUrl = uploadData.url

      // Step 2: AI analyzes the image and returns a search query
      const aiRes = await fetch("/api/ai/search-by-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      })
      const aiData = await aiRes.json()

      if (!aiRes.ok) {
        throw new Error(aiData.error || "AI analysis failed. Please try text search.")
      }

      // Step 3: Apply category + search query from AI response.
      // Setting category first ensures relevant products show even if the
      // search keywords don't exactly match product names.
      const query = aiData.searchQuery?.trim()
      const category = aiData.category?.trim()
      if (query || category) {
        setSearchInput(query || "")
        if (category) {
          // setCategory clears searchQuery, so call setSearchQuery AFTER
          setCategory(category)
          if (query) setSearchQuery(query)
        } else {
          setSearchQuery(query)
        }
        setShowSearch(false)
        setShowSuggestions(false)
        toast.success("Found similar Rakhis!", {
          id: toastId,
          description: category
            ? `Showing ${category}${query ? ` matching "${query}"` : ""}`
            : `Searching for: "${query}"`,
          duration: 3000,
          icon: <Sparkles size={18} className="text-white" />,
          style: { background: "var(--primary)", color: "white", border: "none" },
        })
      } else {
        throw new Error("Couldn't identify the Rakhi. Try a clearer photo or use text search.")
      }
    } catch (e: any) {
      toast.error("Image search failed", {
        id: toastId,
        description: e.message || "Unknown error",
        duration: 5000,
      })
    } finally {
      setImageSearchLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
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
        <div className="bg-gradient-to-r from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] text-[var(--background)] text-xs sm:text-sm py-2 overflow-hidden border-b border-[var(--accent)]/30">
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
          "sticky top-0 z-50 transition-all duration-500 relative",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_4px_30px_rgba(139,30,62,0.08)] border-b border-[var(--border)]"
            : "bg-gradient-to-b from-[var(--background)] to-[var(--background)]/95 border-b border-[var(--border)]/50"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-[var(--primary)] hover:bg-[var(--cream)] rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <button
              onClick={() => useStore.getState().goHome()}
              className="flex flex-col items-center group"
            >
              <span className="font-hero text-3xl sm:text-4xl leading-none tracking-tight">
                <span className="text-[var(--primary)]">House of </span>
                <span className="text-[var(--primary)]">Neelam</span>
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.3em] text-[var(--primary)] uppercase mt-1 font-semibold">
                ✦ Rakhi Collection ✦
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => useStore.getState().goHome()}
                className={cn(
                  "px-4 py-2 text-sm tracking-elegant uppercase font-medium rounded-md transition-all",
                  view === "home" ? "text-[var(--primary)]" : "text-[var(--foreground)] hover:text-[var(--primary)]"
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
                    view === "shop" || view === "search" ? "text-[var(--primary)]" : "text-[var(--foreground)] hover:text-[var(--primary)]"
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
                      className="absolute top-full left-0 mt-2 w-[560px] max-w-[calc(100vw-2rem)] bg-white shadow-[0_20px_60px_rgba(139,30,62,0.15)] rounded-xl border border-[var(--border)] p-6 grid grid-cols-2 gap-2"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => navToCategory(cat.name)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--background)] transition-all text-left group"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--cream)] flex-shrink-0 ring-2 ring-transparent group-hover:ring-[var(--accent)] transition-all">
                            {cat.image ? (
                              <img src={categoryThumbnail(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--primary)] font-serif font-bold text-xl">
                                {cat.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                              {cat.name}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                              {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => { setView("shop"); setShowCategories(false) }}
                        className="col-span-2 mt-2 py-3 text-center text-sm tracking-elegant uppercase font-semibold text-[var(--primary)] hover:bg-[var(--background)] rounded-lg transition-colors border-t border-[var(--border)]"
                      >
                        View All Collection →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => { useStore.setState({ infoPageId: "story" }); setView("info") }}
                className="px-4 py-2 text-sm tracking-elegant uppercase font-medium text-[var(--foreground)] hover:text-[var(--primary)] rounded-md transition-all"
              >
                Our Story
              </button>

              <button
                onClick={() => { useStore.setState({ infoPageId: "contact" }); setView("info") }}
                className="px-4 py-2 text-sm tracking-elegant uppercase font-medium text-[var(--foreground)] hover:text-[var(--primary)] rounded-md transition-all"
              >
                Contact
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search toggle — click to expand search overlay (doesn't take space when closed) */}
              <button
                onClick={() => {
                  setShowSearch(!showSearch)
                  if (!showSearch) {
                    setTimeout(() => searchInputRef.current?.focus(), 100)
                  }
                }}
                className="p-2.5 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--cream)] rounded-md transition-all"
                aria-label="Search"
              >
                {showSearch ? <X size={20} /> : <Search size={20} />}
              </button>

              <button
                onClick={() => setView("wishlist")}
                className="relative p-2.5 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--cream)] rounded-md transition-all"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--primary)] text-[var(--background)] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold animate-badge-pop">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--cream)] rounded-md transition-all"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--accent)] text-[var(--foreground)] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-badge-pop">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Account button */}
              <button
                onClick={() => setAdminOpen(true)}
                className="p-2.5 text-[var(--foreground)] hover:text-[var(--primary)] rounded-md transition-all"
                aria-label="Account"
              >
                <User size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable search overlay — only visible when search icon clicked.
            Absolute positioned so it doesn't push hero carousel / collection dropdown down. */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full bg-white border-t border-[var(--border)] shadow-lg z-[60] overflow-hidden"
            >
              <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3" ref={searchRef}>
                <form onSubmit={onSearch}>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                      placeholder="Search for Rakhis, categories..."
                      className="w-full pl-10 sm:pl-12 pr-28 sm:pr-36 py-2.5 sm:py-3 bg-[var(--background)] border-2 border-[var(--accent)]/30 rounded-full text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {/* Image search button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageSearchLoading}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--cream)] rounded-full transition-colors disabled:opacity-50 border border-[var(--accent)]/30"
                        aria-label="Search by image"
                        title="Search by image — upload a Rakhi photo"
                      >
                        {imageSearchLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                        <span className="hidden sm:inline">Photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && onImageSearch(e.target.files[0])}
                      />
                      <button
                        type="submit"
                        className="px-3 sm:px-4 py-1.5 bg-[var(--primary)] text-[var(--background)] text-xs tracking-elegant uppercase font-semibold rounded-full hover:bg-[var(--primary-dark)] transition-colors"
                      >
                        Search
                      </button>
                    </div>

                    {/* Autocomplete suggestions */}
                    {showSuggestions && (searchResults.length > 0 || searchLoading) && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-[0_20px_60px_rgba(139,30,62,0.15)] border border-[var(--border)] overflow-hidden z-50">
                        {searchLoading ? (
                          <div className="p-4 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Searching...
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto">
                            {searchResults.map((product) => (
                              <button
                                key={product.id}
                                onClick={() => onSuggestionClick(product.slug)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)]/50 last:border-0"
                              >
                                <img src={product.primaryImage} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{product.name}</p>
                                  <p className="text-xs text-[var(--muted-foreground)]">{product.category}</p>
                                </div>
                                <span className="text-sm font-bold text-[var(--primary)] flex-shrink-0">
                                  ₹{product.price}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </div>
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
              className="lg:hidden bg-white border-t border-[var(--border)] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
                <form onSubmit={onSearch} className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search Rakhis..."
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  </div>
                </form>
                <button
                  onClick={() => useStore.getState().goHome()}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] rounded-md"
                >
                  Home
                </button>
                <button
                  onClick={() => setView("shop")}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] rounded-md"
                >
                  All Collection
                </button>
                <div className="px-3 py-1 text-xs tracking-elegant uppercase text-[var(--muted-foreground)] font-semibold">
                  Collections
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navToCategory(cat.name)}
                      className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background)] rounded-md"
                    >
                      <div className="w-7 h-7 rounded overflow-hidden bg-[var(--cream)] flex-shrink-0">
                        {cat.image ? (
                          <img src={categoryThumbnail(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--primary)] font-serif font-bold text-sm">
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
                  onClick={() => { useStore.setState({ infoPageId: "story" }); setView("info") }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] rounded-md"
                >
                  Our Story
                </button>
                <button
                  onClick={() => { useStore.setState({ infoPageId: "contact" }); setView("info") }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] rounded-md"
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
