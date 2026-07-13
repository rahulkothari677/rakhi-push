"use client"

import { useStore } from "@/lib/store"
import { useEffect, useState } from "react"
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle, Sparkles, Heart } from "lucide-react"

export function Footer() {
  const { setView, setCategory, openInfo } = useStore()
  const [settings, setSettings] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {})
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  const whatsapp = settings?.whatsapp
  const contact = settings?.contact
  const social = settings?.social

  return (
    <footer className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--primary)] text-white mt-20 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="h-1 gradient-gold" />

      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' fill='%23FFD700'/%3E%3C/svg%3E")`,
      }} />

      {/* Footer — larger with bigger fonts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
        {/* Top row: Brand + all sections in horizontal grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <h3 className="font-serif text-2xl font-bold leading-none mb-3">
              <span className="text-[var(--background)]">House of </span>
              <span className="text-gradient-gold italic">Neelam</span>
            </h3>
            <p className="text-xs tracking-[0.3em] text-[var(--accent)] uppercase mb-4 flex items-center gap-2">
              <span>❖</span> Rakhi Collection <span>❖</span>
            </p>
            <p className="text-sm text-[var(--background)]/70 leading-relaxed mb-4 max-w-sm">
              Handcrafted premium Rakhis celebrating the eternal bond between brothers and sisters.
            </p>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-[var(--accent)]">
                <Sparkles size={13} /> Premium Quality
              </div>
              <div className="flex items-center gap-1.5 text-sm text-[var(--accent)]">
                <Heart size={13} className="fill-current" /> Made in India
              </div>
            </div>
            {social && (social.instagram || social.facebook || social.youtube) && (
              <div className="flex gap-3">
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--background)]/10 hover:bg-[var(--accent)] hover:text-[var(--foreground)] flex items-center justify-center transition-all hover:scale-110">
                    <Instagram size={16} />
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--background)]/10 hover:bg-[var(--accent)] hover:text-[var(--foreground)] flex items-center justify-center transition-all hover:scale-110">
                    <Facebook size={16} />
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--background)]/10 hover:bg-[var(--accent)] hover:text-[var(--foreground)] flex items-center justify-center transition-all hover:scale-110">
                    <Youtube size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm tracking-elegant uppercase text-[var(--accent)] font-bold mb-4 flex items-center gap-2">
              <span className="h-px w-5 bg-[var(--accent)]" /> Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--background)]/80">
              <li><button onClick={() => useStore.getState().goHome()} className="hover:text-[var(--accent)] transition-colors">Home</button></li>
              <li><button onClick={() => setView("shop")} className="hover:text-[var(--accent)] transition-colors">Collection</button></li>
              <li><button onClick={() => setView("wishlist")} className="hover:text-[var(--accent)] transition-colors">Wishlist</button></li>
              <li><button onClick={() => openInfo("about")} className="hover:text-[var(--accent)] transition-colors">About</button></li>
              <li><button onClick={() => openInfo("contact")} className="hover:text-[var(--accent)] transition-colors">Contact</button></li>
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-sm tracking-elegant uppercase text-[var(--accent)] font-bold mb-4 flex items-center gap-2">
              <span className="h-px w-5 bg-[var(--accent)]" /> Collections
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--background)]/80">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button onClick={() => setCategory(c.name)} className="hover:text-[var(--accent)] transition-colors text-left">
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm tracking-elegant uppercase text-[var(--accent)] font-bold mb-4 flex items-center gap-2">
              <span className="h-px w-5 bg-[var(--accent)]" /> Contact
            </h4>
            <ul className="space-y-3 text-sm text-[var(--background)]/80">
              {contact?.email && (
                <li className="flex items-center gap-2">
                  <Mail size={15} className="text-[var(--accent)] flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-[var(--accent)] transition-colors break-all">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={15} className="text-[var(--accent)] flex-shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-[var(--accent)] transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.address && (
                <li className="flex items-center gap-2">
                  <MapPin size={15} className="text-[var(--accent)] flex-shrink-0" />
                  <span>{contact.address}</span>
                </li>
              )}
              {whatsapp?.primaryNumber && (
                <li className="pt-2">
                  <a
                    href={`https://wa.me/${whatsapp.primaryNumber.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-all hover:scale-105"
                  >
                    <MessageCircle size={14} /> WhatsApp Us
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-[var(--accent)]/20 text-sm text-[var(--background)]/60">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} House of Neelam. Made with <Heart size={12} className="fill-[var(--primary)] text-[var(--primary)]" /> in India
          </p>
          <div className="flex gap-5">
            <button onClick={() => openInfo("shipping")} className="hover:text-[var(--accent)] transition-colors">Shipping</button>
            <button onClick={() => openInfo("care")} className="hover:text-[var(--accent)] transition-colors">Care</button>
            <button onClick={() => openInfo("privacy")} className="hover:text-[var(--accent)] transition-colors">Privacy</button>
            <button onClick={() => openInfo("terms")} className="hover:text-[var(--accent)] transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
