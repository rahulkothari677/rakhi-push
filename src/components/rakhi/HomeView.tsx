"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Crown, Heart, Shield, Truck, Gift } from "lucide-react"
import { useStore } from "@/lib/store"
import { HeroCarousel } from "./HeroCarousel"
import { ProductCard, type Product } from "./ProductCard"
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
  const { setView, setCategory, openProduct } = useStore()
  const [featured, setFeatured] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ctaContent, setCtaContent] = useState<any>(null)

  useEffect(() => {
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

      {/* Trust badges strip — premium dark with gold accents */}
      <section className="bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--foreground)] text-[var(--background)] py-6 border-y-2 border-[var(--accent)]/30 relative overflow-hidden">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--accent) 1px, transparent 1px), radial-gradient(circle at 80% 50%, var(--accent) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative">
          {[
            { icon: Crown, title: "Premium Quality", sub: "Handcrafted with care" },
            { icon: Truck, title: "Free Shipping", sub: "On orders above ₹999" },
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
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center flex-shrink-0 shadow-lg">
                <b.icon size={18} className="text-[var(--foreground)]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--background)]">{b.title}</div>
                <div className="text-xs text-[var(--accent)]">{b.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='%238B1E3E'/%3E%3C/svg%3E")`,
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
              {/* Dark gradient overlay for text contrast (always present) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                <h3 className="font-serif text-base sm:text-lg font-semibold leading-tight text-background drop-shadow-lg">
                  {cat.name}
                </h3>
                <p className="text-[10px] tracking-elegant uppercase mt-1.5 font-semibold text-accent">
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

      {/* Featured Rakhis */}
      <section className="py-20 bg-gradient-to-b from-[var(--background)] to-[var(--cream)]/50 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' fill='%238B1E3E'/%3E%3C/svg%3E")`,
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

      {/* Quote / Story section — premium with decorative elements */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--foreground)]" />
        {/* Decorative mandala pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='60' cy='60' r='50' fill='none' stroke='%23C9A24B' stroke-width='1'/%3E%3Ccircle cx='60' cy='60' r='30' fill='none' stroke='%23C9A24B' stroke-width='1'/%3E%3Cpath d='M60 10 L60 110 M10 60 L110 60' stroke='%23C9A24B' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute inset-0 opacity-10">
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
              <Sparkles size={20} className="text-[var(--accent)]" />
            </div>
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-[var(--accent)] text-2xl">❖</span>
            <span className="text-[var(--accent)] text-3xl font-serif">&ldquo;</span>
            <span className="text-[var(--accent)] text-2xl">❖</span>
          </div>
          <p className="font-serif text-2xl sm:text-4xl lg:text-5xl text-[var(--background)] italic leading-relaxed mb-8">
            A brother may not be a friend, but a friend will always be a brother. The sacred thread of Rakhi binds not just wrists, but hearts across lifetimes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-[var(--accent)]" />
            <p className="text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-semibold">
              House of Neelam
            </p>
            <div className="h-px w-12 bg-[var(--accent)]" />
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </section>

      {/* New Arrivals */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' fill='%23C9A24B'/%3E%3C/svg%3E")`,
        }} />
        <div className="relative">
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

      {/* Festive / Gift box CTA */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[var(--cream)] to-[var(--background)] rounded-2xl p-8 sm:p-12 lg:p-16 border border-[var(--accent)]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--primary)]/10 rounded-full translate-y-1/3 -translate-x-1/3" />

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
