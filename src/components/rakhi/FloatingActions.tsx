"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, ChevronUp } from "lucide-react"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false)
  const [whatsapp, setWhatsapp] = useState<any>(null)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll)
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setWhatsapp(d.settings?.whatsapp))
      .catch(() => {})
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col gap-3">
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-12 h-12 rounded-full bg-[var(--foreground)] text-[var(--accent)] shadow-luxe-hover flex items-center justify-center hover:bg-[var(--primary)] hover:text-[var(--background)] transition-colors"
            aria-label="Back to top"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {whatsapp?.primaryNumber && (
        <motion.a
          href={buildWhatsAppUrl(
            whatsapp.primaryNumber,
            `🙏 Namaste ${whatsapp.brandName || "House of Neelam"}! I'd like to know more about your Rakhis.`
          )}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-luxe-hover flex items-center justify-center relative"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={26} className="fill-current" />
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        </motion.a>
      )}
    </div>
  )
}
