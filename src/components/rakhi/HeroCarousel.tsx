"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useStore } from "@/lib/store"
import { heroImage } from "@/lib/images"

type Slide = {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  ctaLabel?: string | null
  ctaLink?: string | null
}

export function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [current, setCurrent] = useState(0)
  const { setView, setCategory } = useStore()

  useEffect(() => {
    fetch("/api/hero-slides")
      .then((r) => r.json())
      .then((d) => setSlides(d.slides || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  // Touch swipe support for mobile
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (slides.length <= 1) return
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent((c) => (c + 1) % slides.length)
      } else {
        setCurrent((c) => (c - 1 + slides.length) % slides.length)
      }
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  if (!slides.length) {
    return (
      <section className="relative h-[70vh] sm:h-[80vh] min-h-[500px] bg-gradient-to-br from-[var(--cream)] via-[var(--background)] to-[var(--cream)] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="font-serif text-3xl text-[var(--primary)]">House of Neelam</div>
          <div className="text-sm tracking-[0.3em] text-[var(--accent)] uppercase mt-2">Loading...</div>
        </div>
      </section>
    )
  }

  const slide = slides[current]

  const onCta = () => {
    if (slide.ctaLink === "shop") setView("shop")
    else if (slide.ctaLink) setCategory(slide.ctaLink)
    else setView("shop")
  }

  return (
    <section
      className="relative h-[70vh] sm:h-[85vh] min-h-[520px] overflow-hidden pt-16 sm:pt-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background image with Ken Burns */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={heroImage(slide.image)}
              alt={slide.title}
              className="w-full h-full object-cover animate-kenburns"
            />
            {/* Subtle light overlay for text contrast — minimal, keeps image vibrant */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start sm:items-center justify-center sm:justify-start pt-8 sm:pt-0">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl text-center sm:text-left"
            >
              <div className="hidden sm:inline-block bg-[var(--primary)]/90 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-white font-medium">
                  {slide.subtitle}
                </p>
              </div>

              {/* Hero title — Great Vibes font, golden color on mobile, burgundy on desktop */}
              <h1 className="font-hero text-5xl sm:text-7xl lg:text-8xl leading-[1.1] mb-4 drop-shadow-lg text-[var(--accent)] sm:text-[var(--primary)]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                {slide.title}
              </h1>

              {/* Description — hidden on mobile, shown on sm+ — plain text, lighter color */}
              <p className="hidden sm:block font-body text-base sm:text-lg text-[var(--foreground)]/80 leading-relaxed mb-8 max-w-xl font-medium drop-shadow-sm">
                {slide.description}
              </p>

              {/* Buttons — hidden on mobile, shown on sm+ */}
              <div className="hidden sm:flex flex-wrap gap-4">
                {slide.ctaLabel && (
                  <button
                    onClick={onCta}
                    className="btn-luxe px-8 py-4 bg-[var(--primary)] text-white text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors shadow-luxe-hover"
                  >
                    {slide.ctaLabel}
                  </button>
                )}
                <button
                  onClick={() => setView("shop")}
                  className="btn-luxe px-8 py-4 bg-white text-[var(--primary)] border-2 border-[var(--primary)] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors"
                >
                  Browse Collection
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls — arrows hidden on mobile, swipe instead */}
      {slides.length > 1 && (
        <>
          {/* Desktop arrows only */}
          <button
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border-2 border-[var(--accent)] text-[var(--primary)] items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border-2 border-[var(--accent)] text-[var(--primary)] items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots — visible on all sizes */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-8 bg-[var(--accent)]" : "w-1.5 bg-[var(--background)]/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
