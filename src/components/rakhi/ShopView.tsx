"use client"

import { useEffect, useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import { ProductCard, type Product } from "./ProductCard"
import { Filter, X, SlidersHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { categoryThumbnail } from "@/lib/images"

type Category = {
  id: string
  name: string
  icon?: string | null
  productCount: number
}

export function ShopView() {
  const { selectedCategory, setCategory, searchQuery, setSearchQuery } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory) params.set("category", selectedCategory)
    if (searchQuery) params.set("search", searchQuery)
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [selectedCategory, searchQuery])

  const filtered = useMemo(() => {
    let result = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    )
    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price)
    else if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [products, sortBy, priceRange])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Page header */}
      <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--primary)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-[var(--accent)]" />
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-medium">
              {selectedCategory || "All Rakhis"}
            </p>
            <div className="h-px w-12 bg-[var(--accent)]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold">
            {selectedCategory || "The Complete Collection"}
          </h1>
          {searchQuery && (
            <p className="mt-3 text-[var(--background)]/80">
              Search results for: <span className="text-[var(--accent)] font-semibold">&ldquo;{searchQuery}&rdquo;</span>
            </p>
          )}
          <p className="mt-3 text-[var(--background)]/70 max-w-2xl mx-auto">
            Each Rakhi is handcrafted with devotion, celebrating the eternal bond between brother and sister.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          <button
            onClick={() => {
              setCategory(null)
              setSearchQuery("")
            }}
            className={cn(
              "px-4 py-2 rounded-full text-xs tracking-elegant uppercase font-semibold whitespace-nowrap transition-colors",
              !selectedCategory
                ? "bg-[var(--primary)] text-[var(--background)]"
                : "bg-white text-[var(--foreground)] hover:bg-[var(--cream)] border border-[var(--border)]"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.name)}
              className={cn(
                "px-4 py-2 rounded-full text-xs tracking-elegant uppercase font-semibold whitespace-nowrap transition-colors flex items-center gap-2",
                selectedCategory === cat.name
                  ? "bg-[var(--primary)] text-[var(--background)]"
                  : "bg-white text-[var(--foreground)] hover:bg-[var(--cream)] border border-[var(--border)]"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full overflow-hidden flex-shrink-0",
                selectedCategory === cat.name ? "bg-[var(--background)]/20" : "bg-[var(--cream)]"
              )}>
                {cat.image ? (
                  <img src={categoryThumbnail(cat.image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                    {cat.name.charAt(0)}
                  </div>
                )}
              </div>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--cream)] transition-colors lg:hidden"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
            <p className="text-sm text-[var(--muted-foreground)]">
              <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> {filtered.length === 1 ? "Rakhi" : "Rakhis"} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted-foreground)] tracking-elegant uppercase">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-[var(--border)] rounded-md px-3 py-1.5 bg-white outline-none focus:border-[var(--accent)]"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <AnimatePresence>
            {(showFilters || typeof window !== "undefined") && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "w-64 flex-shrink-0",
                  showFilters ? "block fixed inset-0 z-50 bg-black/40 lg:relative lg:bg-transparent lg:z-auto" : "hidden lg:block"
                )}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowFilters(false)
                }}
              >
                <div className="bg-white p-6 rounded-lg border border-[var(--border)] lg:sticky lg:top-28 max-h-screen lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6 lg:hidden">
                    <h3 className="font-serif text-lg font-bold">Filters</h3>
                    <button onClick={() => setShowFilters(false)}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-3">
                      Price Range
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Under ₹250", min: 0, max: 250 },
                        { label: "₹250 - ₹500", min: 250, max: 500 },
                        { label: "₹500 - ₹1000", min: 500, max: 1000 },
                        { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
                        { label: "Above ₹2000", min: 2000, max: 10000 },
                      ].map((r) => (
                        <button
                          key={r.label}
                          onClick={() => setPriceRange([r.min, r.max])}
                          className={cn(
                            "block w-full text-left text-sm py-1.5 px-2 rounded transition-colors",
                            priceRange[0] === r.min && priceRange[1] === r.max
                              ? "bg-[var(--cream)] text-[var(--primary)] font-semibold"
                              : "text-[var(--muted-foreground)] hover:bg-[var(--background)]"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setPriceRange([0, 10000])}
                        className="block w-full text-left text-xs text-[var(--primary)] hover:underline mt-2"
                      >
                        Clear price filter
                      </button>
                    </div>
                  </div>

                  <div className="divider-gold mb-6" />

                  <div>
                    <h4 className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-3">
                      Categories
                    </h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setCategory(null)}
                        className={cn(
                          "block w-full text-left text-sm py-1.5 px-2 rounded transition-colors",
                          !selectedCategory
                            ? "bg-[var(--cream)] text-[var(--primary)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--background)]"
                        )}
                      >
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.name)}
                          className={cn(
                            "block w-full text-left text-sm py-1.5 px-2 rounded transition-colors flex items-center gap-2",
                            selectedCategory === cat.name
                              ? "bg-[var(--cream)] text-[var(--primary)] font-semibold"
                              : "text-[var(--muted-foreground)] hover:bg-[var(--background)]"
                          )}
                        >
                          <div className="w-6 h-6 rounded overflow-hidden bg-[var(--cream)] flex-shrink-0">
                            {cat.image ? (
                              <img src={categoryThumbnail(cat.image)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                                {cat.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span>{cat.name}</span>
                          <span className="ml-auto text-xs text-[var(--accent)]">{cat.productCount}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Products grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-luxe border border-[var(--border)]/60">
                    <div className="aspect-square shimmer" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 w-1/3 rounded shimmer" />
                      <div className="h-4 w-2/3 rounded shimmer" />
                      <div className="h-5 w-1/2 rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🪔</div>
                <h3 className="font-serif text-2xl font-semibold text-[var(--foreground)] mb-2">
                  No Rakhis found
                </h3>
                <p className="text-[var(--muted-foreground)] mb-6">
                  Try adjusting your filters or browse all Rakhis.
                </p>
                <button
                  onClick={() => {
                    setCategory(null)
                    setSearchQuery("")
                    setPriceRange([0, 10000])
                  }}
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
