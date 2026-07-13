"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Mail, Phone, Clock, MessageCircle, MapPin } from "lucide-react"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { infoImage } from "@/lib/images"

type InfoPageId = "about" | "story" | "care" | "shipping" | "contact" | "privacy" | "terms"

const defaultContent: Record<string, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: "House of Neelam respects your privacy. We collect only the information necessary to process your orders and provide you with the best service. We do not sell or share your personal information with third parties.\n\nWhen you place an order via WhatsApp, your phone number and order details are used solely to fulfill your request. Payment information is handled securely through trusted payment gateways.\n\nYou may request access to, correction of, or deletion of your personal data at any time by contacting us.\n\nBy using our website, you consent to our privacy practices as described here.",
  },
  terms: {
    title: "Terms & Conditions",
    body: "By accessing and using the House of Neelam website, you agree to the following terms:\n\n1. Products: All Rakhis are handcrafted and may have slight variations in design, color, and size, which adds to their unique charm.\n\n2. Pricing: All prices are in Indian Rupees (₹) and are subject to change without notice. Prices displayed at the time of order placement are final.\n\n3. Orders: Orders are confirmed once payment is received. We reserve the right to refuse or cancel any order at our discretion.\n\n4. Shipping: We ship across India. Delivery timelines are estimates and may vary based on location and logistics.\n\n5. Returns: Due to the personal nature of Rakhis, returns are accepted only for damaged or defective products, within 3 days of delivery.\n\n6. Intellectual Property: All content on this website, including images, designs, and text, is the property of House of Neelam and may not be reproduced without permission.",
  },
}

export function InfoPage({ pageId }: { pageId: InfoPageId }) {
  const { setView } = useStore()
  const [content, setContent] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/site-content?section=${pageId}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([c, s]) => {
        setContent(c.data || defaultContent[pageId])
        setSettings(s.settings)
      })
      .catch(() => setContent(defaultContent[pageId]))
      .finally(() => setLoading(false))
  }, [pageId])

  const pageTitle =
    content?.title ||
    (pageId === "about" ? "About House of Neelam" :
     pageId === "story" ? "The Story of Raksha Bandhan" :
     pageId === "care" ? "Care Instructions" :
     pageId === "shipping" ? "Shipping & Delivery" :
     pageId === "contact" ? "Get in Touch" :
     pageId === "privacy" ? "Privacy Policy" :
     pageId === "terms" ? "Terms & Conditions" : "")

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--primary)] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-[var(--accent)]" />
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[var(--accent)] font-medium">
              House of Neelam
            </p>
            <div className="h-px w-12 bg-[var(--accent)]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-[var(--cream)] rounded shimmer" />
            <div className="h-4 bg-[var(--cream)] rounded shimmer w-3/4" />
            <div className="h-4 bg-[var(--cream)] rounded shimmer w-5/6" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-lg max-w-none"
          >
            {content?.image && (
              <div className="aspect-[2/1] rounded-xl overflow-hidden mb-8 shadow-luxe">
                <img src={infoImage(content.image)} alt={pageTitle} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-[var(--foreground)] leading-relaxed space-y-4 text-base">
              {(content?.body || defaultContent[pageId]?.body || "").split("\n").map((line: string, i: number) => (
                <p key={i} className={line.startsWith("•") ? "ml-4" : ""}>
                  {line}
                </p>
              ))}
            </div>

            {/* Contact section */}
            {pageId === "contact" && settings && (
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                {settings.contact?.email && (
                  <div className="flex items-start gap-3 p-5 bg-white rounded-lg border border-[var(--border)]">
                    <Mail size={20} className="text-[var(--accent)] mt-0.5" />
                    <div>
                      <p className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-1">Email</p>
                      <a href={`mailto:${settings.contact.email}`} className="text-sm text-[var(--foreground)] hover:text-[var(--primary)]">
                        {settings.contact.email}
                      </a>
                    </div>
                  </div>
                )}
                {settings.contact?.phone && (
                  <div className="flex items-start gap-3 p-5 bg-white rounded-lg border border-[var(--border)]">
                    <Phone size={20} className="text-[var(--accent)] mt-0.5" />
                    <div>
                      <p className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-1">Phone</p>
                      <a href={`tel:${settings.contact.phone}`} className="text-sm text-[var(--foreground)] hover:text-[var(--primary)]">
                        {settings.contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {content?.hours && (
                  <div className="flex items-start gap-3 p-5 bg-white rounded-lg border border-[var(--border)]">
                    <Clock size={20} className="text-[var(--accent)] mt-0.5" />
                    <div>
                      <p className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-1">Hours</p>
                      <p className="text-sm text-[var(--foreground)]">{content.hours}</p>
                    </div>
                  </div>
                )}
                {settings.contact?.address && (
                  <div className="flex items-start gap-3 p-5 bg-white rounded-lg border border-[var(--border)]">
                    <MapPin size={20} className="text-[var(--accent)] mt-0.5" />
                    <div>
                      <p className="text-xs tracking-elegant uppercase text-[var(--accent)] font-semibold mb-1">Address</p>
                      <p className="text-sm text-[var(--foreground)]">{settings.contact.address}</p>
                    </div>
                  </div>
                )}
                {settings.whatsapp?.primaryNumber && (
                  <div className="sm:col-span-2">
                    <a
                      href={buildWhatsAppUrl(settings.whatsapp.primaryNumber, `🙏 Namaste ${settings.whatsapp.brandName || "House of Neelam"}! I have a question.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] text-white text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-colors w-full"
                    >
                      <MessageCircle size={18} /> Chat with us on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className="mt-12 text-center">
          <button
            onClick={() => setView("shop")}
            className="text-sm text-[var(--primary)] hover:underline tracking-elegant uppercase font-semibold"
          >
            ← Back to Collection
          </button>
        </div>
      </div>
    </div>
  )
}
