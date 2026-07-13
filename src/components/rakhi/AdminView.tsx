"use client"

import { useState, useEffect, useCallback } from "react"
import { useStore } from "@/lib/store"
import { signOut, useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, LayoutDashboard, Package, FolderTree, Image, FileText, Settings, ShoppingBag,
  Plus, Pencil, Trash2, Save, Upload, Loader2, LogOut, Sparkles, TrendingUp,
  Users, AlertCircle, Phone, ChevronRight, Star, Check,
} from "lucide-react"
import { cn, formatINR, slugify, generateSKU, parseJSON } from "@/lib/utils"
import { thumbnailImage, categoryImage, heroImage, ctaImage } from "@/lib/images"
import { PRESET_THEMES, FONT_OPTIONS } from "@/lib/themes"
import { AdminLogin } from "./AdminLogin"

type Tab = "dashboard" | "products" | "categories" | "hero" | "content" | "settings" | "orders" | "themes"

export function AdminView() {
  const { isAdminOpen, setAdminOpen } = useStore()
  const { data: session } = useSession()
  const [showLogin, setShowLogin] = useState(false)
  const [tab, setTab] = useState<Tab>("dashboard")

  useEffect(() => {
    if (isAdminOpen && !session) {
      setShowLogin(true)
    } else if (isAdminOpen && session) {
      setShowLogin(false)
    }
  }, [isAdminOpen, session])

  if (!isAdminOpen) return null

  return (
    <div className="fixed inset-0 z-[90] bg-[#FBF6EC] flex flex-col">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-[#2A0A0F] to-[#8B1E3E] text-[#FBF6EC] py-3 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-[#C9A24B]" />
          <div>
            <h1 className="font-serif text-base sm:text-lg font-bold leading-none">
              House of Neelam — Admin
            </h1>
            <p className="text-[10px] text-[#C9A24B] tracking-elegant uppercase mt-0.5">
              Management Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <>
              <span className="hidden sm:inline text-xs text-[#FBF6EC]/70">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/", redirect: false })}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-1.5"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </>
          )}
          <button
            onClick={() => setAdminOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
            aria-label="Close admin"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {showLogin ? (
        <AdminLogin onClose={() => setAdminOpen(false)} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-16 sm:w-56 bg-[#2A0A0F] text-[#FBF6EC] flex-shrink-0 flex flex-col">
            <nav className="flex-1 p-2 sm:p-3 space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "products", label: "Products", icon: Package },
                { id: "categories", label: "Categories", icon: FolderTree },
                { id: "hero", label: "Hero Slides", icon: Image },
                { id: "content", label: "Site Content", icon: FileText },
                { id: "orders", label: "Orders", icon: ShoppingBag },
                { id: "themes", label: "Themes", icon: Sparkles },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as Tab)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    tab === item.id
                      ? "bg-[#8B1E3E] text-[#FBF6EC] font-semibold"
                      : "text-[#FBF6EC]/70 hover:bg-white/10 hover:text-[#FBF6EC]"
                  )}
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {tab === "dashboard" && <DashboardTab />}
            {tab === "products" && <ProductsTab />}
            {tab === "categories" && <CategoriesTab />}
            {tab === "hero" && <HeroTab />}
            {tab === "content" && <ContentTab />}
            {tab === "orders" && <OrdersTab />}
            {tab === "settings" && <SettingsTab />}
            {tab === "themes" && <ThemesTab />}
          </main>
        </div>
      )}
    </div>
  )
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
  }

  const cards = [
    { label: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, color: "bg-[#8B1E3E]" },
    { label: "Categories", value: stats?.totalCategories ?? 0, icon: FolderTree, color: "bg-[#C9A24B]" },
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "bg-[#5C8C3E]" },
    { label: "Revenue", value: formatINR(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "bg-[#6B5544]" },
    { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: AlertCircle, color: "bg-[#B3324A]" },
    { label: "Featured", value: stats?.featuredProducts ?? 0, icon: Star, color: "bg-[#A8425B]" },
  ]

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[#2A0A0F] mb-1">Dashboard</h2>
      <p className="text-sm text-[#6B5544] mb-6">Welcome back! Here's what's happening with your store.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-lg border border-[#E8D9B8] shadow-luxe"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", card.color)}>
                <card.icon size={18} />
              </div>
              <p className="text-xs tracking-elegant uppercase text-[#6B5544] font-semibold">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-[#2A0A0F]">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-5 rounded-lg border border-[#E8D9B8] shadow-luxe mb-6">
        <h3 className="font-serif text-lg font-bold text-[#2A0A0F] mb-4">Recent Orders</h3>
        {stats?.recentOrders?.length ? (
          <div className="space-y-2">
            {stats.recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-[#FBF6EC] rounded-md">
                <div>
                  <p className="text-sm font-semibold text-[#2A0A0F]">{order.orderNumber}</p>
                  <p className="text-xs text-[#6B5544]">
                    {order.customerName} • {order.customerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#8B1E3E]">{formatINR(order.total)}</p>
                  <p className="text-xs text-[#6B5544]">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B5544] text-center py-4">No orders yet.</p>
        )}
      </div>

      {/* Low Stock */}
      {stats?.lowStockProducts?.length > 0 && (
        <div className="bg-white p-5 rounded-lg border border-[#B3324A]/30 shadow-luxe">
          <h3 className="font-serif text-lg font-bold text-[#B3324A] mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> Low Stock Alert
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 p-2 bg-[#B3324A]/5 rounded-md">
                <img src={thumbnailImage(p.primaryImage)} alt="" className="w-10 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#2A0A0F] truncate">{p.name}</p>
                  <p className="text-xs text-[#B3324A]">{p.inStock} in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ])
      .then(([p, c]) => {
        setProducts(p.products || [])
        setCategories(c.categories || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    load()
  }

  if (showForm || editing) {
    return (
      <ProductForm
        product={editing}
        categories={categories}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSaved={() => { setShowForm(false); setEditing(null); load() }}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2A0A0F]">Products</h2>
          <p className="text-sm text-[#6B5544]">{products.length} products in your catalog</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-[#6B5544] mb-4">No products yet.</p>
          <button onClick={() => setShowForm(true)} className="text-[#8B1E3E] underline text-sm">Add your first product</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E8D9B8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4EAD5] text-[#2A0A0F]">
                <tr>
                  <th className="text-left p-3 font-semibold">Product</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell">Category</th>
                  <th className="text-left p-3 font-semibold">Price</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Stock</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Status</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-[#E8D9B8] hover:bg-[#FBF6EC]/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={thumbnailImage(p.primaryImage)} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#2A0A0F] truncate max-w-xs">{p.name}</p>
                          <p className="text-xs text-[#6B5544]">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#6B5544] hidden sm:table-cell">{p.category}</td>
                    <td className="p-3 font-semibold text-[#8B1E3E]">{formatINR(p.price)}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs", p.inStock < 5 ? "bg-[#B3324A]/10 text-[#B3324A]" : "bg-[#5C8C3E]/10 text-[#5C8C3E]")}>
                        {p.inStock}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {p.isActive ? (
                        <span className="px-2 py-0.5 bg-[#5C8C3E]/10 text-[#5C8C3E] rounded-full text-xs">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#6B5544]/10 text-[#6B5544] rounded-full text-xs">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(p)} className="w-8 h-8 rounded-md hover:bg-[#F4EAD5] flex items-center justify-center text-[#8B1E3E]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-md hover:bg-[#B3324A]/10 flex items-center justify-center text-[#B3324A]">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductForm({ product, categories, onClose, onSaved }: {
  product: any
  categories: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name || "",
    category: product?.category || categories[0]?.name || "Traditional Rakhi",
    categoryId: product?.categoryId || categories[0]?.id || "",
    price: product?.price?.toString() || "",
    compareAtPrice: product?.compareAtPrice?.toString() || "",
    shortDescription: product?.shortDescription || "",
    description: product?.description || "",
    badge: product?.badge || "",
    inStock: product?.inStock?.toString() || "50",
    isFeatured: product?.isFeatured || false,
    isActive: product?.isActive ?? true,
    images: parseJSON(product?.images || "[]", []) as string[],
    materials: parseJSON(product?.materials || "[]", []).join(", ") as string,
    features: parseJSON(product?.features || "[]", []).join(", ") as string,
    sku: product?.sku || generateSKU(),
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleUpload = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    const fd = new FormData()
    for (const f of Array.from(files)) fd.append("files", f)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.urls) {
        setForm((f) => ({ ...f, images: [...f.images, ...data.urls] }))
      } else if (data.needsCloudinary) {
        alert("⚠️ Image upload requires Cloudinary on Vercel.\n\nPlease set these env vars in Vercel:\n• CLOUDINARY_CLOUD_NAME\n• CLOUDINARY_API_KEY\n• CLOUDINARY_API_SECRET\n\nSign up free at https://cloudinary.com\n\nSee README.md for step-by-step instructions.")
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"))
      }
    } catch (e: any) {
      alert("Upload failed: " + (e.message || "Network error"))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      inStock: Number(form.inStock) || 0,
      images: form.images,
      materials: form.materials.split(",").map((s) => s.trim()).filter(Boolean),
      features: form.features.split(",").map((s) => s.trim()).filter(Boolean),
    }
    try {
      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products"
      const method = product ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onSaved()
      } else {
        const e = await res.json()
        alert("Error: " + e.error)
      }
    } catch (e) {
      alert("Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-[#2A0A0F]">
          {product ? "Edit Product" : "Add New Product"}
        </h2>
        <button onClick={onClose} className="text-sm text-[#8B1E3E] hover:underline">← Back to list</button>
      </div>

      <div className="bg-white rounded-lg border border-[#E8D9B8] p-6 space-y-5">
        {/* Images */}
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-2 block">
            Product Images
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-[#E8D9B8] group">
                <img src={thumbnailImage(img)} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#B3324A] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-md border-2 border-dashed border-[#C9A24B]/50 flex items-center justify-center cursor-pointer hover:bg-[#FBF6EC] transition-colors">
              {uploading ? <Loader2 className="animate-spin text-[#C9A24B]" size={20} /> : <Upload size={20} className="text-[#C9A24B]" />}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
          </div>
          <p className="text-xs text-[#6B5544]">📐 <strong>Recommended size: 1200 × 1200 px (square 1:1)</strong> — Square images display perfectly in product cards, product detail, cart, and wishlist. JPG/PNG, max 5MB.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => {
                const cat = categories.find((c) => c.name === e.target.value)
                setForm({ ...form, category: e.target.value, categoryId: cat?.id || "" })
              }}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Price (₹) *
            </label>
            <input
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Compare-at Price (₹)
            </label>
            <input
              type="number"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Stock
            </label>
            <input
              type="number"
              value={form.inStock}
              onChange={(e) => setForm({ ...form, inStock: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Badge (e.g. "New", "Bestseller")
            </label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              SKU
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Short Description (one line)
          </label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
        </div>

        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Full Description
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B] resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Materials (comma-separated)
            </label>
            <input
              type="text"
              value={form.materials}
              onChange={(e) => setForm({ ...form, materials: e.target.value })}
              placeholder="22K Gold-plated brass, Kundan stones, Silk moli"
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Features (comma-separated)
            </label>
            <input
              type="text"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="Handcrafted, Premium gold plating, Comes in gift box"
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-[#8B1E3E]"
            />
            <span className="text-sm font-medium text-[#2A0A0F]">Featured Product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-[#8B1E3E]"
            />
            <span className="text-sm font-medium text-[#2A0A0F]">Active (visible on store)</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#E8D9B8]">
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.price}
            className="px-6 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {product ? "Update Product" : "Create Product"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-[#E8D9B8] text-[#2A0A0F] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#F4EAD5] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will remain but lose their category link.")) return
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
    load()
  }

  if (showForm || editing) {
    return (
      <CategoryForm
        category={editing}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSaved={() => { setShowForm(false); setEditing(null); load() }}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2A0A0F]">Categories</h2>
          <p className="text-sm text-[#6B5544]">{categories.length} categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-lg border border-[#E8D9B8] shadow-luxe overflow-hidden">
              {/* Category image */}
              <div className="aspect-[16/10] bg-[#FBF6EC] relative overflow-hidden">
                {c.image ? (
                  <img src={categoryImage(c.image)} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#6B5544] text-xs">
                    No image uploaded
                  </div>
                )}
                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => setEditing(c)} className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center text-[#8B1E3E]">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center text-[#B3324A]">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-base font-bold text-[#2A0A0F]">{c.name}</h3>
                <p className="text-xs text-[#6B5544] mt-1 line-clamp-2">{c.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-[#C9A24B] font-semibold">{c.productCount} items</span>
                  <span className={c.isActive ? "text-[#5C8C3E]" : "text-[#6B5544]"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryForm({ category, onClose, onSaved }: {
  category: any
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image: category?.image || "",
    order: category?.order?.toString() || "0",
    isActive: category?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    const fd = new FormData()
    for (const f of Array.from(files)) fd.append("files", f)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.urls?.[0]) {
        setForm((f) => ({ ...f, image: data.urls[0] }))
      } else if (data.needsCloudinary) {
        alert("⚠️ Image upload requires Cloudinary on Vercel.\n\nPlease set these env vars in Vercel:\n• CLOUDINARY_CLOUD_NAME\n• CLOUDINARY_API_KEY\n• CLOUDINARY_API_SECRET\n\nSign up free at https://cloudinary.com")
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"))
      }
    } catch (e: any) {
      alert("Upload failed: " + (e.message || "Network error"))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories"
      const method = category ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: Number(form.order) }),
      })
      if (res.ok) onSaved()
      else alert("Error saving category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-[#2A0A0F]">
          {category ? "Edit Category" : "Add New Category"}
        </h2>
        <button onClick={onClose} className="text-sm text-[#8B1E3E] hover:underline">← Back</button>
      </div>

      <div className="bg-white rounded-lg border border-[#E8D9B8] p-6 space-y-4 max-w-xl">
        {/* Category Image Upload */}
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-2 block">
            Category Image
          </label>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-lg overflow-hidden border border-[#E8D9B8] bg-[#FBF6EC] flex-shrink-0">
              {form.image ? (
                <img src={form.image} alt="Category" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#6B5544] text-xs text-center px-2">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8D9B8] text-sm rounded-md cursor-pointer hover:bg-[#F4EAD5] transition-colors">
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={14} /> {form.image ? "Change Image" : "Upload Image"}</>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleUpload(e.target.files)}
                />
              </label>
              {form.image && (
                <button
                  onClick={() => setForm({ ...form, image: "" })}
                  className="ml-2 text-xs text-[#B3324A] hover:underline"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-[#6B5544] mt-1.5">
                📐 <strong>Recommended size: 1000 × 1250 px (portrait 4:5)</strong> — This fits the homepage category grid perfectly. JPG/PNG, max 5MB.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Category Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Premium Gold Rakhi"
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
        </div>

        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of this category..."
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B] resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Display Order
            </label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-7">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-[#8B1E3E]"
            />
            <span className="text-sm font-medium text-[#2A0A0F]">Active</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-[#E8D9B8]">
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="px-6 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {category ? "Update" : "Create"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border border-[#E8D9B8] text-[#2A0A0F] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#F4EAD5] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── HERO SLIDES ─────────────────────────────────────────────────────────────
function HeroTab() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/hero-slides")
      .then((r) => r.json())
      .then((d) => setSlides(d.slides || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    const res = await fetch("/api/admin/hero-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New Slide",
        subtitle: "SUBTITLE",
        description: "Description",
        image: "/images/hero-1.svg",
        ctaLabel: "Shop Now",
        ctaLink: "shop",
        order: slides.length,
        isActive: true,
      }),
    })
    if (res.ok) load()
  }

  const handleUpdate = async (slide: any) => {
    await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slide),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return
    await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" })
    load()
  }

  const handleUpload = async (slideIdx: number, files: FileList) => {
    if (!files.length) return
    const fd = new FormData()
    fd.append("files", files[0])
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.urls?.[0]) {
        const updated = [...slides]
        updated[slideIdx].image = data.urls[0]
        setSlides(updated)
        await handleUpdate(updated[slideIdx])
      } else if (data.needsCloudinary) {
        alert("⚠️ Image upload requires Cloudinary on Vercel.\n\nPlease set these env vars in Vercel:\n• CLOUDINARY_CLOUD_NAME\n• CLOUDINARY_API_KEY\n• CLOUDINARY_API_SECRET\n\nSign up free at https://cloudinary.com")
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"))
      }
    } catch (e: any) {
      alert("Upload failed: " + (e.message || "Network error"))
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2A0A0F]">Hero Slides</h2>
          <p className="text-sm text-[#6B5544]">Manage homepage carousel slides</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Slide
        </button>
      </div>

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div key={slide.id} className="bg-white p-4 rounded-lg border border-[#E8D9B8]">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
                  Image
                </label>
                <div className="aspect-[2/1] rounded-md overflow-hidden bg-[#FBF6EC] border border-[#E8D9B8] mb-2">
                  <img src={heroImage(slide.image)} alt="" className="w-full h-full object-cover" />
                </div>
                <label className="px-3 py-1.5 border border-[#E8D9B8] text-xs rounded-md cursor-pointer hover:bg-[#F4EAD5] inline-flex items-center gap-1.5">
                  <Upload size={12} /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(idx, e.target.files)} />
                </label>
                <p className="text-xs text-[#6B5544] mt-1">📐 1920 × 1080 px (16:9 landscape)</p>
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Title"
                    value={slide.title}
                    onChange={(e) => { const u = [...slides]; u[idx].title = e.target.value; setSlides(u) }}
                    onBlur={() => handleUpdate(slide)}
                    className="px-3 py-1.5 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={slide.subtitle}
                    onChange={(e) => { const u = [...slides]; u[idx].subtitle = e.target.value; setSlides(u) }}
                    onBlur={() => handleUpdate(slide)}
                    className="px-3 py-1.5 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={slide.description}
                  onChange={(e) => { const u = [...slides]; u[idx].description = e.target.value; setSlides(u) }}
                  onBlur={() => handleUpdate(slide)}
                  className="w-full px-3 py-1.5 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B] resize-none"
                />
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="CTA Label"
                    value={slide.ctaLabel || ""}
                    onChange={(e) => { const u = [...slides]; u[idx].ctaLabel = e.target.value; setSlides(u) }}
                    onBlur={() => handleUpdate(slide)}
                    className="px-3 py-1.5 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="text"
                    placeholder="CTA Link"
                    value={slide.ctaLink || ""}
                    onChange={(e) => { const u = [...slides]; u[idx].ctaLink = e.target.value; setSlides(u) }}
                    onBlur={() => handleUpdate(slide)}
                    className="px-3 py-1.5 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                  />
                  <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) => { const u = [...slides]; u[idx].isActive = e.target.checked; setSlides(u); handleUpdate({ ...slide, isActive: e.target.checked }) }}
                      className="w-4 h-4 accent-[#8B1E3E]"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#6B5544]">Order: {slide.order}</span>
                  <button onClick={() => handleDelete(slide.id)} className="text-xs text-[#B3324A] hover:underline flex items-center gap-1">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────
function ContentTab() {
  const [sections, setSections] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("about")
  const [saving, setSaving] = useState(false)

  const sectionsList = [
    { id: "about", label: "About Us" },
    { id: "story", label: "Story of Raksha Bandhan" },
    { id: "care", label: "Care Instructions" },
    { id: "shipping", label: "Shipping & Delivery" },
    { id: "contact", label: "Contact Info" },
    { id: "cta", label: "Festive CTA Section" },
  ]

  useEffect(() => {
    fetch("/api/site-content")
      .then((r) => r.json())
      .then((d) => setSections(d.contents || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const data = sections[active] || {}
    await fetch("/api/admin/site-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: active, data }),
    })
    setSaving(false)
    alert("Saved!")
  }

  const update = (field: string, value: string) => {
    setSections((s) => ({
      ...s,
      [active]: { ...(s[active] || {}), [field]: value },
    }))
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
  }

  const current = sections[active] || {}

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[#2A0A0F] mb-1">Site Content</h2>
      <p className="text-sm text-[#6B5544] mb-6">Edit pages like About, Story, Care, Shipping</p>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {sectionsList.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors",
              active === s.id
                ? "bg-[#8B1E3E] text-[#FBF6EC] font-semibold"
                : "bg-white text-[#2A0A0F] border border-[#E8D9B8] hover:bg-[#F4EAD5]"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[#E8D9B8] p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Title
          </label>
          <input
            type="text"
            value={current.title || ""}
            onChange={(e) => update("title", e.target.value)}
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
        </div>
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Body Content
          </label>
          <textarea
            rows={12}
            value={current.body || ""}
            onChange={(e) => update("body", e.target.value)}
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B] resize-y font-mono"
          />
          <p className="text-xs text-[#6B5544] mt-1">Use line breaks for paragraphs. Each line becomes its own paragraph.</p>
        </div>

        {active === "contact" && (
          <>
            <div>
              <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
                Hours
              </label>
              <input
                type="text"
                value={current.hours || ""}
                onChange={(e) => update("hours", e.target.value)}
                className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
              />
            </div>
          </>
        )}

        {active === "cta" && (
          <CTASectionEditor current={current} update={update} />
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Content
        </button>
      </div>
    </div>
  )
}

// ─── CTA SECTION EDITOR (Don't forget the Roli-Chawal Thali) ─────────────────
function CTASectionEditor({ current, update }: {
  current: any
  update: (field: string, value: string) => void
}) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    const fd = new FormData()
    for (const f of Array.from(files)) fd.append("files", f)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.urls?.[0]) {
        update("image", data.urls[0])
      } else if (data.needsCloudinary) {
        alert("⚠️ Image upload requires Cloudinary on Vercel.\n\nPlease set these env vars in Vercel:\n• CLOUDINARY_CLOUD_NAME\n• CLOUDINARY_API_KEY\n• CLOUDINARY_API_SECRET\n\nSign up free at https://cloudinary.com")
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"))
      }
    } catch (e: any) {
      alert("Upload failed: " + (e.message || "Network error"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#6B5544] bg-[#F4EAD5] p-3 rounded-md">
        💡 This controls the &ldquo;Don&apos;t forget the Roli-Chawal Thali&rdquo; section on the homepage. Edit the text, button, and image here.
      </p>

      {/* Image upload */}
      <div>
        <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-2 block">
          CTA Image
        </label>
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden border border-[#E8D9B8] bg-[#FBF6EC] flex-shrink-0">
            {current.image ? (
              <img src={ctaImage(current.image)} alt="CTA" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6B5544] text-xs text-center px-2">
                No image
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8D9B8] text-sm rounded-md cursor-pointer hover:bg-[#F4EAD5] transition-colors">
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Uploading...</>
              ) : (
                <><Upload size={14} /> {current.image ? "Change Image" : "Upload Image"}</>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
            {current.image && (
              <button
                onClick={() => update("image", "")}
                className="ml-2 text-xs text-[#B3324A] hover:underline"
              >
                Remove
              </button>
            )}
            <p className="text-xs text-[#6B5544] mt-1.5">
              📐 <strong>Recommended size: 1000 × 1000 px (square 1:1)</strong> — Square image for the CTA section. JPG/PNG, max 5MB.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Eyebrow Text
          </label>
          <input
            type="text"
            value={current.eyebrow || ""}
            onChange={(e) => update("eyebrow", e.target.value)}
            placeholder="Complete the Celebration"
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
        </div>
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            Title Accent (italicized part)
          </label>
          <input
            type="text"
            value={current.titleAccent || ""}
            onChange={(e) => update("titleAccent", e.target.value)}
            placeholder="Roli-Chawal Thali"
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
        </div>
      </div>

      <div>
        <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
          Title Prefix (main part of heading)
        </label>
        <input
          type="text"
          value={current.titlePrefix || ""}
          onChange={(e) => update("titlePrefix", e.target.value)}
          placeholder="Don't forget the"
          className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
        />
      </div>

      <div>
        <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
          Description
        </label>
        <textarea
          rows={3}
          value={current.description || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Complete your Raksha Bandhan ritual with our beautifully crafted thali sets..."
          className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B] resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            CTA Button Label
          </label>
          <input
            type="text"
            value={current.ctaLabel || ""}
            onChange={(e) => update("ctaLabel", e.target.value)}
            placeholder="Shop Thali Sets"
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
        </div>
        <div>
          <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
            CTA Category (button links to)
          </label>
          <input
            type="text"
            value={current.ctaCategory || ""}
            onChange={(e) => update("ctaCategory", e.target.value)}
            placeholder="Roli-Chawal & Thali"
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          />
          <p className="text-xs text-[#6B5544] mt-1">
            Enter the exact category name. The button will filter products by this category.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  const statusColors: Record<string, string> = {
    PENDING: "bg-[#C9A24B]/10 text-[#C9A24B]",
    CONFIRMED: "bg-[#5C8C3E]/10 text-[#5C8C3E]",
    SHIPPED: "bg-[#8B1E3E]/10 text-[#8B1E3E]",
    DELIVERED: "bg-[#5C8C3E]/10 text-[#5C8C3E]",
    CANCELLED: "bg-[#B3324A]/10 text-[#B3324A]",
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[#2A0A0F] mb-1">Orders</h2>
      <p className="text-sm text-[#6B5544] mb-4">All orders received via WhatsApp</p>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {["all", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors",
              filter === s
                ? "bg-[#8B1E3E] text-[#FBF6EC] font-semibold"
                : "bg-white text-[#2A0A0F] border border-[#E8D9B8] hover:bg-[#F4EAD5]"
            )}
          >
            {s === "all" ? "All Orders" : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-[#E8D9B8]">
          <p className="text-sm text-[#6B5544]">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg border border-[#E8D9B8]">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-[#2A0A0F]">{order.orderNumber}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", statusColors[order.status])}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5544] mt-1">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#8B1E3E]">{formatINR(order.total)}</p>
                  <p className="text-xs text-[#6B5544]">{order.items.length} items</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-3 p-3 bg-[#FBF6EC] rounded-md">
                <div>
                  <p className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1">Customer</p>
                  <p className="text-sm text-[#2A0A0F] font-semibold">{order.customerName}</p>
                  <p className="text-xs text-[#6B5544]">{order.customerPhone}</p>
                  {order.customerEmail && <p className="text-xs text-[#6B5544]">{order.customerEmail}</p>}
                </div>
                <div>
                  <p className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1">Address</p>
                  <p className="text-xs text-[#6B5544]">
                    {order.customerAddress || "N/A"}<br />
                    {[order.customerCity, order.customerState, order.customerPincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img src={thumbnailImage(item.image)} alt="" className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-[#2A0A0F]">{item.name}</p>
                      <p className="text-[#6B5544]">Qty: {item.quantity} × {formatINR(item.price)}</p>
                    </div>
                    <p className="font-semibold text-[#8B1E3E]">{formatINR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#E8D9B8]">
                <span className="text-xs text-[#6B5544]">Update status:</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="text-xs px-2 py-1 border border-[#E8D9B8] rounded bg-white outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                {order.customerPhone && order.customerPhone !== "N/A" && (
                  <a
                    href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-xs px-3 py-1 bg-[#25D366] text-white rounded-md hover:bg-[#1FAE54] flex items-center gap-1"
                  >
                    <Phone size={11} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── THEMES ──────────────────────────────────────────────────────────────────
function ThemesTab() {
  const [activeTheme, setActiveTheme] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/site-content?section=theme")
      .then((r) => r.json())
      .then((d) => setActiveTheme(d.data || { presetId: "classic-burgundy" }))
      .catch(() => setActiveTheme({ presetId: "classic-burgundy" }))
      .finally(() => setLoading(false))
  }, [])

  const applyPreset = async (presetId: string) => {
    setSaving(true)
    const themeData = { presetId }
    setActiveTheme(themeData)
    await fetch("/api/admin/site-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "theme", data: themeData }),
    })
    setSaving(false)
    // Reload page to apply theme
    window.location.reload()
  }

  const applyCustomTheme = async (customTheme: any) => {
    setSaving(true)
    setActiveTheme(customTheme)
    await fetch("/api/admin/site-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "theme", data: customTheme }),
    })
    setSaving(false)
    window.location.reload()
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[#2A0A0F] mb-1">Themes</h2>
      <p className="text-sm text-[#6B5544] mb-6">Choose a preset theme or create a custom one. Changes apply instantly site-wide.</p>

      {/* Preset Themes */}
      <div className="mb-8">
        <h3 className="text-sm tracking-elegant uppercase text-[#C9A24B] font-semibold mb-4">Preset Themes</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESET_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyPreset(theme.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all text-left group",
                activeTheme?.presetId === theme.id
                  ? "border-[#8B1E3E] shadow-lg scale-105"
                  : "border-[#E8D9B8] hover:border-[#C9A24B] hover:shadow-md"
              )}
            >
              {/* Preview swatch */}
              <div
                className="h-24 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: theme.preview.bg }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-bold" style={{ color: theme.preview.text }}>
                    Aa
                  </span>
                  <span className="text-2xl" style={{ color: theme.preview.accent }}>❖</span>
                </div>
                {/* Color dots */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <div className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: theme.colors.primary }} />
                  <div className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: theme.colors.accent }} />
                  <div className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: theme.colors.background }} />
                </div>
                {/* Active checkmark */}
                {activeTheme?.presetId === theme.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#5C8C3E] text-white flex items-center justify-center">
                    <Check size={14} />
                  </div>
                )}
              </div>
              <h4 className="font-serif text-base font-bold text-[#2A0A0F]">{theme.name}</h4>
              <p className="text-xs text-[#6B5544] mt-1">{theme.description}</p>
              <p className="text-[10px] text-[#C9A24B] mt-2 tracking-elegant uppercase font-semibold">
                {theme.fonts.serif} + {theme.fonts.sans}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Theme Builder */}
      <CustomThemeBuilder
        activeTheme={activeTheme}
        onSave={applyCustomTheme}
        saving={saving}
      />

      {/* Reset button */}
      <div className="mt-6">
        <button
          onClick={() => applyPreset("classic-burgundy")}
          className="px-4 py-2 text-xs text-[#B3324A] hover:bg-[#B3324A]/10 rounded-md transition-colors"
        >
          ↺ Reset to Default (Classic Burgundy)
        </button>
      </div>
    </div>
  )
}

function CustomThemeBuilder({ activeTheme, onSave, saving }: {
  activeTheme: any
  onSave: (theme: any) => void
  saving: boolean
}) {
  const [custom, setCustom] = useState({
    colors: activeTheme?.colors || PRESET_THEMES[0].colors,
    fonts: activeTheme?.fonts || PRESET_THEMES[0].fonts,
  })

  const updateColor = (key: string, value: string) => {
    setCustom({
      ...custom,
      colors: { ...custom.colors, [key]: value },
    })
  }

  const updateFont = (key: string, value: string) => {
    setCustom({
      ...custom,
      fonts: { ...custom.fonts, [key]: value },
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8D9B8] p-6">
      <h3 className="text-sm tracking-elegant uppercase text-[#C9A24B] font-semibold mb-4">Custom Theme Builder</h3>
      <p className="text-xs text-[#6B5544] mb-4">Pick your own colors and fonts. Click &quot;Apply Custom Theme&quot; to save.</p>

      {/* Color pickers */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { key: "primary", label: "Primary Color" },
          { key: "primaryDark", label: "Primary Dark" },
          { key: "accent", label: "Accent (Gold)" },
          { key: "accentDark", label: "Accent Dark" },
          { key: "background", label: "Background" },
          { key: "foreground", label: "Text Color" },
          { key: "muted", label: "Muted Text" },
          { key: "border", label: "Border" },
        ].map((c) => (
          <div key={c.key}>
            <label className="text-xs text-[#6B5544] mb-1.5 block font-medium">{c.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(custom.colors as any)[c.key] || "#8B1E3E"}
                onChange={(e) => updateColor(c.key, e.target.value)}
                className="w-10 h-10 rounded border border-[#E8D9B8] cursor-pointer"
              />
              <input
                type="text"
                value={(custom.colors as any)[c.key] || ""}
                onChange={(e) => updateColor(c.key, e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-[#E8D9B8] rounded outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Font pickers */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-[#6B5544] mb-1.5 block font-medium">Heading Font</label>
          <select
            value={custom.fonts.serif}
            onChange={(e) => updateFont("serif", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E8D9B8] rounded-md bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          >
            {FONT_OPTIONS.serif.map((f) => (
              <option key={f.value} value={f.value}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#6B5544] mb-1.5 block font-medium">Body Font</label>
          <select
            value={custom.fonts.sans}
            onChange={(e) => updateFont("sans", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E8D9B8] rounded-md bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
          >
            {FONT_OPTIONS.sans.map((f) => (
              <option key={f.value} value={f.value}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live preview */}
      <div className="mb-4">
        <label className="text-xs text-[#6B5544] mb-2 block font-medium">Live Preview</label>
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: custom.colors.background,
            borderColor: custom.colors.border,
          }}
        >
          <h4 className="text-2xl font-bold mb-2" style={{ fontFamily: custom.fonts.serif, color: custom.colors.foreground }}>
            House of <span style={{ color: custom.colors.primary }}>Neelam</span>
          </h4>
          <p className="text-sm mb-3" style={{ fontFamily: custom.fonts.sans, color: custom.colors.muted }}>
            Premium handcrafted Rakhis for the eternal bond
          </p>
          <div className="flex gap-2">
            <span
              className="px-4 py-2 rounded-md text-xs font-semibold"
              style={{ backgroundColor: custom.colors.primary, color: custom.colors.background }}
            >
              Add to Cart
            </span>
            <span
              className="px-4 py-2 rounded-md text-xs font-semibold border-2"
              style={{ borderColor: custom.colors.accent, color: custom.colors.accent }}
            >
              Buy Now
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave(custom)}
        disabled={saving}
        className="px-6 py-2.5 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Apply Custom Theme
      </button>
    </div>
  )
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (key: string, value: any) => {
    setSaving(true)
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    setSaving(false)
  }

  if (loading || !settings) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8B1E3E]" size={28} /></div>
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[#2A0A0F] mb-1">Settings</h2>
      <p className="text-sm text-[#6B5544] mb-6">Configure WhatsApp numbers, contact info, shipping, and more</p>

      <div className="space-y-6 max-w-3xl">
        {/* WhatsApp Numbers */}
        <SettingsCard
          title="WhatsApp Numbers"
          icon={Phone}
          description="The numbers that will receive customer orders and inquiries. You can add multiple numbers (orders will go to the primary number)."
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
                Primary WhatsApp Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.whatsapp?.primaryNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, primaryNumber: e.target.value } })}
                  className="flex-1 px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                  placeholder="+919504970435"
                />
                <button
                  onClick={() => handleSave("whatsapp", settings.whatsapp)}
                  disabled={saving}
                  className="px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
                Additional Numbers
              </label>
              <div className="space-y-2">
                {(settings.whatsapp?.secondaryNumbers || []).map((num: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={num}
                      onChange={(e) => {
                        const arr = [...(settings.whatsapp.secondaryNumbers || [])]
                        arr[i] = e.target.value
                        setSettings({ ...settings, whatsapp: { ...settings.whatsapp, secondaryNumbers: arr } })
                      }}
                      className="flex-1 px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                    />
                    <button
                      onClick={() => {
                        const arr = (settings.whatsapp.secondaryNumbers || []).filter((_, idx) => idx !== i)
                        setSettings({ ...settings, whatsapp: { ...settings.whatsapp, secondaryNumbers: arr } })
                      }}
                      className="px-3 py-2 text-[#B3324A] hover:bg-[#B3324A]/10 rounded-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, secondaryNumbers: [...(settings.whatsapp.secondaryNumbers || []), ""] },
                    })
                  }}
                  className="text-xs text-[#8B1E3E] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add another number
                </button>
              </div>
              {(settings.whatsapp?.secondaryNumbers || []).length > 0 && (
                <button
                  onClick={() => handleSave("whatsapp", settings.whatsapp)}
                  disabled={saving}
                  className="mt-2 px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
                >
                  Save All Numbers
                </button>
              )}
            </div>
            <div>
              <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
                Brand Name (used in WhatsApp messages)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.whatsapp?.brandName || ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp: { ...settings.whatsapp, brandName: e.target.value } })}
                  className="flex-1 px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
                />
                <button
                  onClick={() => handleSave("whatsapp", settings.whatsapp)}
                  disabled={saving}
                  className="px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Contact Info */}
        <SettingsCard
          title="Contact Information"
          icon={Phone}
          description="Displayed in the footer and contact page"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="Email"
              value={settings.contact?.email || ""}
              onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, email: e.target.value } })}
              className="px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
            <input
              type="text"
              placeholder="Phone"
              value={settings.contact?.phone || ""}
              onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, phone: e.target.value } })}
              className="px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
            <input
              type="text"
              placeholder="Address"
              value={settings.contact?.address || ""}
              onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, address: e.target.value } })}
              className="sm:col-span-2 px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <button
            onClick={() => handleSave("contact", settings.contact)}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
          >
            Save Contact
          </button>
        </SettingsCard>

        {/* Shipping */}
        <SettingsCard
          title="Shipping Settings"
          icon={TrendingUp}
          description="Configure free shipping threshold and flat rate"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6B5544] mb-1 block">Free Shipping Above (₹)</label>
              <input
                type="number"
                value={settings.shipping?.freeAbove || 0}
                onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, freeAbove: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B5544] mb-1 block">Flat Shipping Rate (₹)</label>
              <input
                type="number"
                value={settings.shipping?.flatRate || 0}
                onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, flatRate: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.shipping?.codAvailable ?? true}
              onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, codAvailable: e.target.checked } })}
              className="w-4 h-4 accent-[#8B1E3E]"
            />
            <span className="text-sm">Cash on Delivery available</span>
          </label>
          <button
            onClick={() => handleSave("shipping", settings.shipping)}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50 block"
          >
            Save Shipping
          </button>
        </SettingsCard>

        {/* Announcement */}
        <SettingsCard
          title="Announcement Bar"
          icon={Sparkles}
          description="Scrolling announcement shown at the top of every page"
        >
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.announcement?.enabled ?? true}
              onChange={(e) => setSettings({ ...settings, announcement: { ...settings.announcement, enabled: e.target.checked } })}
              className="w-4 h-4 accent-[#8B1E3E]"
            />
            <span className="text-sm">Show announcement bar</span>
          </label>
          <textarea
            rows={2}
            value={settings.announcement?.text || ""}
            onChange={(e) => setSettings({ ...settings, announcement: { ...settings.announcement, text: e.target.value } })}
            className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B] resize-none"
          />
          <button
            onClick={() => handleSave("announcement", settings.announcement)}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
          >
            Save Announcement
          </button>
        </SettingsCard>

        {/* Social */}
        <SettingsCard
          title="Social Media"
          icon={TrendingUp}
          description="Links shown in the footer"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Instagram URL"
              value={settings.social?.instagram || ""}
              onChange={(e) => setSettings({ ...settings, social: { ...settings.social, instagram: e.target.value } })}
              className="px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
            <input
              type="text"
              placeholder="Facebook URL"
              value={settings.social?.facebook || ""}
              onChange={(e) => setSettings({ ...settings, social: { ...settings.social, facebook: e.target.value } })}
              className="px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
            <input
              type="text"
              placeholder="YouTube URL"
              value={settings.social?.youtube || ""}
              onChange={(e) => setSettings({ ...settings, social: { ...settings.social, youtube: e.target.value } })}
              className="px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
            <input
              type="text"
              placeholder="Pinterest URL"
              value={settings.social?.pinterest || ""}
              onChange={(e) => setSettings({ ...settings, social: { ...settings.social, pinterest: e.target.value } })}
              className="px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
            />
          </div>
          <button
            onClick={() => handleSave("social", settings.social)}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
          >
            Save Social
          </button>
        </SettingsCard>

        {/* Branding */}
        <SettingsCard
          title="Branding"
          icon={Sparkles}
          description="Tagline and other brand info"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6B5544] mb-1 block">Tagline</label>
              <input
                type="text"
                value={settings.branding?.tagline || ""}
                onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, tagline: e.target.value } })}
                className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B5544] mb-1 block">Established Year</label>
              <input
                type="text"
                value={settings.branding?.establishedYear || ""}
                onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, establishedYear: e.target.value } })}
                className="w-full px-3 py-2 border border-[#E8D9B8] rounded-md text-sm bg-[#FBF6EC] outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>
          <button
            onClick={() => handleSave("branding", settings.branding)}
            disabled={saving}
            className="mt-3 px-4 py-2 bg-[#8B1E3E] text-[#FBF6EC] text-xs rounded-md hover:bg-[#6B0E2A] disabled:opacity-50"
          >
            Save Branding
          </button>
        </SettingsCard>

        {/* Reseed button */}
        <SettingsCard
          title="Demo Data"
          icon={Sparkles}
          description="Reset all demo data (products, categories, hero, content, settings)"
        >
          <button
            onClick={async () => {
              if (!confirm("This will delete all products and categories and reseed demo data. Continue?")) return
              const res = await fetch("/api/admin/seed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true }),
              })
              if (res.ok) {
                alert("Demo data reseeded!")
                window.location.reload()
              }
            }}
            className="px-4 py-2 bg-[#B3324A] text-[#FBF6EC] text-xs rounded-md hover:bg-[#8B1E3E]"
          >
            Reseed Demo Data
          </button>
        </SettingsCard>
      </div>
    </div>
  )
}

function SettingsCard({ title, icon: Icon, description, children }: {
  title: string
  icon: any
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E8D9B8] p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-full bg-[#8B1E3E]/10 flex items-center justify-center">
          <Icon size={16} className="text-[#8B1E3E]" />
        </div>
        <h3 className="font-serif text-lg font-bold text-[#2A0A0F]">{title}</h3>
      </div>
      {description && <p className="text-xs text-[#6B5544] mb-4 ml-12">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </div>
  )
}
