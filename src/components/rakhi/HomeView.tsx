"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Crown, Heart, Shield, Truck, Gift } from "lucide-react"
import { useStore } from "@/lib/store"
import { HeroCarousel } from "./HeroCarousel"
import { ProductCard, type Product } from "./ProductCard"
import { CountdownTimer } from "./CountdownTimer"
import { categoryImagePortrait, ctaImage } from "@/lib/images"

type Category = {
  id: string
  name: string
  description?: string
  icon?: string | null
  image?: string | null
  productCount: number
}

export function HomeView() {
  const { setView, setCategory, openProduct, recentlyViewed } = useStore()
  const [featured, setFeatured] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ctaContent, setCtaContent] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {})
    fetch("/api/products?featured=true&limit=8")
      .then((r) => r.json())
      .then((d) => setFeatured(d.products || []))
      .catch(() => {})
    fetch("/api/products?limit=8")
      .then((r) => r.json())
      .then((d) => setNewArrivals(d.products || []))
      .catch(() => {})
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
    fetch("/api/site-content?section=cta")
      .then((r) => r.json())
      .then((d) => setCtaContent(d.data))
      .catch(() => {})
  }, [])

  return (
    <div>
      <HeroCarousel />

      {/* Raksha Bandhan Countdown Timer */}
      <CountdownTimer />

      {/* Trust badges strip — VIBRANT festive gradient (not dark) */}
      <section className="bg-gradient-to-r from-[var(--primary)] via-[var(--primary-dark)] to-[var(--primary)] text-white py-7 border-y-2 border-[var(--accent)] relative overflow-hidden">
        {/* Festive dot pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #FFD700 1.5px, transparent 1.5px), radial-gradient(circle at 80% 50%, #FFD700 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative">
          {[
            { icon: Crown, title: "Premium Quality", sub: "Handcrafted with care" },
            { icon: Truck, title: "Free Shipping", sub: `On orders above ₹${settings?.shipping?.freeAbove || 999}` },
            { icon: Shield, title: "Secure Packaging", sub: "Gift-ready delivery" },
            { icon: Heart, title: "Made with Love", sub: "By Indian artisans" },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center flex-shrink-0 shadow-lg">
                <b.icon size={20} className="text-[var(--primary-dark)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{b.title}</div>
                <div className="text-xs text-[#FFD700]">{b.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Grid — paisley pattern background */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Paisley pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10 Q60 10 60 30 Q60 50 40 50 Q20 50 20 30 Q20 10 40 10 Z' fill='none' stroke='%238B1E3E' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />
        <div className="text-center mb-12 relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--accent)]" />
            <span className="text-[var(--accent)] text-lg">❖</span>
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-semibold">
              Explore Our Collections
            </p>
            <span className="text-[var(--accent)] text-lg">❖</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--accent)]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
            Curated <span className="text-gradient-burgundy italic">Collections</span>
          </h2>
          <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            From traditional moli to diamond-studded luxury — discover Rakhis for every bond and every story.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.slice(0, 8).map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setCategory(cat.name)}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border hover-lift"
            >
              {/* Category image — fills entire box with object-cover (no gaps) */}
              {cat.image ? (
                <img
                  src={categoryImagePortrait(cat.image)}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="font-serif text-5xl font-bold text-primary/30">
                    {cat.name.charAt(0)}
                  </span>
                </div>
              )}
              {/* NO gradient — image fully visible like New Arrivals section */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center pb-5">
                <h3 className="font-serif text-base sm:text-lg font-bold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {cat.name}
                </h3>
                <p className="text-[10px] tracking-elegant uppercase mt-1 font-bold text-[var(--accent)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {cat.productCount} {cat.productCount === 1 ? "Item" : "Items"}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight size={12} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => setView("shop")}
            className="btn-luxe inline-flex items-center gap-2 px-8 py-3.5 border-2 border-primary text-primary text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            View All Collections <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Featured Rakhis — VIBRANT light gradient with dot pattern */}
      <section className="py-20 bg-gradient-to-b from-[#FFF8DC] via-[var(--background)] to-[#FFF8DC] relative overflow-hidden">
        {/* Dot grid pattern — subtle */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, var(--primary) 1.5px, transparent 1.5px)`,
          backgroundSize: '30px 30px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-[var(--accent)]" />
              <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-medium flex items-center gap-2">
                <Sparkles size={14} /> Handpicked for You
              </p>
              <div className="h-px w-12 bg-[var(--accent)]" />
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--foreground)] mb-3">
              Featured <span className="text-gradient-burgundy italic">Rakhis</span>
            </h2>
            <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Our most-loved pieces — each one a celebration of the sacred bond between siblings.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Quote / Story section — VIBRANT festive gradient (not dark/moody) */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00]" />
        {/* Decorative mandala pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='60' cy='60' r='50' fill='none' stroke='%238B1E3E' stroke-width='1'/%3E%3Ccircle cx='60' cy='60' r='30' fill='none' stroke='%238B1E3E' stroke-width='1'/%3E%3Cpath d='M60 10 L60 110 M10 60 L110 60' stroke='%238B1E3E' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-slow"
              style={{
                left: `${5 + i * 12}%`,
                top: `${15 + (i % 4) * 22}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              <Sparkles size={24} className="text-[var(--primary)]" />
            </div>
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-[var(--primary)] text-2xl">❖</span>
            <span className="text-[var(--primary)] text-3xl font-serif">&ldquo;</span>
            <span className="text-[var(--primary)] text-2xl">❖</span>
          </div>
          <p className="font-serif text-2xl sm:text-4xl lg:text-5xl text-[var(--primary-dark)] italic leading-relaxed mb-8">
            A brother may not be a friend, but a friend will always be a brother. The sacred thread of Rakhi binds not just wrists, but hearts across lifetimes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-[var(--primary)]" />
            <p className="text-sm tracking-[0.3em] uppercase text-[var(--primary)] font-bold">
              House of Neelam
            </p>
            <div className="h-px w-12 bg-[var(--primary)]" />
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof — VIBRANT gradient background */}
      <section className="py-20 bg-gradient-to-br from-[#FFF8DC] via-[var(--background)] to-[#FFE4B5] relative overflow-hidden">
        {/* Wave pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q25 0 50 10 T100 10' fill='none' stroke='%238B1E3E' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--accent)]" />
            <span className="text-[var(--accent)] text-lg">❖</span>
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-semibold">
              Loved by Families
            </p>
            <span className="text-[var(--accent)] text-lg">❖</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--accent)]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--foreground)] mb-3">
            What Our <span className="text-gradient-burgundy italic">Customers Say</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Priya Sharma",
              location: "Mumbai",
              text: "The Imperial Gold Peacock Rakhi was absolutely stunning! My brother was speechless. The craftsmanship is heirloom quality — worth every rupee.",
              rating: 5,
            },
            {
              name: "Anjali Patel",
              location: "Delhi",
              text: "Ordered the Lumba set for bhaiya-bhabhi. The pearls and golden work were even more beautiful in person. Felt premium and royal!",
              rating: 5,
            },
            {
              name: "Ritu Agarwal",
              location: "Bangalore",
              text: "The WhatsApp ordering was so easy! Neelam responded immediately and the Rakhi arrived in a beautiful gift box. Highly recommend!",
              rating: 5,
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-xl border border-[var(--border)] shadow-luxe hover:shadow-luxe-hover transition-all hover-lift"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-[var(--accent)] text-lg">★</span>
                ))}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-[var(--background)] font-serif font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* New Arrivals — VIBRANT with diagonal lines pattern */}
      <section className="py-20 bg-gradient-to-b from-[var(--background)] via-[#FFF8DC] to-[var(--background)] relative overflow-hidden">
        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(45deg, var(--accent) 0, var(--accent) 1px, transparent 1px, transparent 20px)`,
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-[var(--accent)]" />
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-medium">
              Fresh Additions
            </p>
            <div className="h-px w-12 bg-[var(--accent)]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--foreground)] mb-3">
            New <span className="text-gradient-burgundy italic">Arrivals</span>
          </h2>
          <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Just landed — the newest pieces in our Rakhi collection, handcrafted and ready to celebrate.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => setView("shop")}
            className="btn-luxe inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors shadow-luxe"
          >
            View All Rakhis <ArrowRight size={16} />
          </button>
        </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--accent)]" />
              <span className="text-[var(--accent)] text-lg">❖</span>
              <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-semibold">
                Pick Up Where You Left Off
              </p>
              <span className="text-[var(--accent)] text-lg">❖</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--accent)]" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3">
              Recently <span className="text-gradient-burgundy italic">Viewed</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentlyViewed.slice(0, 4).map((item, i) => (
              <ProductCard
                key={item.productId}
                product={{
                  id: item.productId,
                  slug: item.slug,
                  name: item.name,
                  category: "",
                  price: item.price,
                  primaryImage: item.image,
                  images: "[]",
                  shortDescription: "",
                  isFeatured: false,
                  rating: 5,
                  reviewCount: 0,
                  sku: item.sku,
                }}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* Festive / Gift box CTA — VIBRANT (not dark) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#FFF8DC] via-[#FFE4B5] to-[#FFD700] rounded-2xl p-8 sm:p-12 lg:p-16 border-2 border-[var(--accent)] relative overflow-hidden shadow-luxe">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/15 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--primary)]/10 rounded-full translate-y-1/3 -translate-x-1/3" />
          {/* Festive star pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 5 L60 35 L90 35 L65 55 L75 85 L50 65 L25 85 L35 55 L10 35 L40 35 Z' fill='%238B1E3E'/%3E%3C/svg%3E")`,
          }} />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Gift size={18} className="text-[var(--accent)]" />
                <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent)] font-semibold">
                  {ctaContent?.eyebrow || "Complete the Celebration"}
                </p>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4 leading-tight">
                {ctaContent?.titlePrefix || "Don't forget the"}{" "}
                <span className="text-gradient-burgundy italic">
                  {ctaContent?.titleAccent || "Roli-Chawal Thali"}
                </span>
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
                {ctaContent?.description ||
                  "Complete your Raksha Bandhan ritual with our beautifully crafted thali sets. Including premium roli, chawal, decorative diya, and traditional brass plates — everything you need for the sacred ceremony."}
              </p>
              <button
                onClick={() => setCategory(ctaContent?.ctaCategory || "Roli-Chawal & Thali")}
                className="btn-luxe inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--primary)] text-[var(--background)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors"
              >
                {ctaContent?.ctaLabel || "Shop Thali Sets"} <ArrowRight size={16} />
              </button>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-xl overflow-hidden shadow-luxe-hover bg-[var(--background)]">
                <img
                  src={ctaImage(ctaContent?.image || "/images/thali-marigold-1.svg")}
                  alt={ctaContent?.titleAccent || "Roli Chawal Thali"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
