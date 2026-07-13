"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useStore } from "@/lib/store"

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

  if (!slides.length) {
    return (
      <section className="relative h-[70vh] sm:h-[80vh] min-h-[500px] bg-gradient-to-br from-[#F4EAD5] via-[#FBF6EC] to-[#F4EAD5] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="font-serif text-3xl text-[#8B1E3E]">House of Neelam</div>
          <div className="text-sm tracking-[0.3em] text-[#C9A24B] uppercase mt-2">Loading...</div>
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
    <section className="relative h-[70vh] sm:h-[85vh] min-h-[520px] overflow-hidden">
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
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover animate-kenburns"
            />
            {/* Overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A0508]/60 via-[#1A0508]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0508]/40 via-transparent to-[#1A0508]/10" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl text-[#FBF6EC]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-12 bg-[#C9A24B]" />
                <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[#C9A24B] font-medium">
                  {slide.subtitle}
                </p>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
                {slide.title}
              </h1>

              <p className="text-base sm:text-lg text-[#FBF6EC]/90 leading-relaxed mb-8 max-w-xl">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-4">
                {slide.ctaLabel && (
                  <button
                    onClick={onCta}
                    className="btn-luxe px-8 py-4 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors shadow-luxe-hover"
                  >
                    {slide.ctaLabel}
                  </button>
                )}
                <button
                  onClick={() => setView("shop")}
                  className="btn-luxe px-8 py-4 border-2 border-[#C9A24B] text-[#C9A24B] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#C9A24B] hover:text-[#2A0A0F] transition-colors"
                >
                  Browse Collection
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#FBF6EC]/20 backdrop-blur-sm border border-[#C9A24B]/50 text-[#FBF6EC] flex items-center justify-center hover:bg-[#C9A24B] hover:text-[#2A0A0F] transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#FBF6EC]/20 backdrop-blur-sm border border-[#C9A24B]/50 text-[#FBF6EC] flex items-center justify-center hover:bg-[#C9A24B] hover:text-[#2A0A0F] transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-8 bg-[#C9A24B]" : "w-1.5 bg-[#FBF6EC]/50"
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
