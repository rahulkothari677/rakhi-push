"use client"

import { useStore } from "@/lib/store"
import { useEffect, useState } from "react"
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle } from "lucide-react"

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
    <footer className="bg-gradient-to-b from-[#2A0A0F] to-[#1A0508] text-[#FBF6EC] mt-20">
      {/* Top decorative border */}
      <div className="h-1 gradient-gold" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <h3 className="font-serif text-2xl font-bold text-[#FBF6EC] leading-none">
                House of <span className="text-gradient-gold italic">Neelam</span>
              </h3>
              <p className="text-[10px] tracking-[0.3em] text-[#C9A24B] uppercase mt-1">
                Rakhi Collection
              </p>
            </div>
            <p className="text-sm text-[#FBF6EC]/70 leading-relaxed mb-4">
              Handcrafted premium Rakhis celebrating the eternal bond between brothers and sisters. Each piece is a timeless symbol of love, devotion, and tradition.
            </p>
            {social && (social.instagram || social.facebook || social.youtube) && (
              <div className="flex gap-3">
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-[#FBF6EC]/10 hover:bg-[#C9A24B] hover:text-[#2A0A0F] flex items-center justify-center transition-colors">
                    <Instagram size={16} />
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-[#FBF6EC]/10 hover:bg-[#C9A24B] hover:text-[#2A0A0F] flex items-center justify-center transition-colors">
                    <Facebook size={16} />
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-[#FBF6EC]/10 hover:bg-[#C9A24B] hover:text-[#2A0A0F] flex items-center justify-center transition-colors">
                    <Youtube size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm tracking-elegant uppercase text-[#C9A24B] font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-[#FBF6EC]/80">
              <li><button onClick={() => setView("home")} className="hover:text-[#C9A24B] transition-colors">Home</button></li>
              <li><button onClick={() => setView("shop")} className="hover:text-[#C9A24B] transition-colors">All Collection</button></li>
              <li><button onClick={() => setView("wishlist")} className="hover:text-[#C9A24B] transition-colors">Wishlist</button></li>
              <li><button onClick={() => openInfo("about")} className="hover:text-[#C9A24B] transition-colors">About Us</button></li>
              <li><button onClick={() => openInfo("story")} className="hover:text-[#C9A24B] transition-colors">Our Story</button></li>
              <li><button onClick={() => openInfo("contact")} className="hover:text-[#C9A24B] transition-colors">Contact</button></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm tracking-elegant uppercase text-[#C9A24B] font-semibold mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-sm text-[#FBF6EC]/80">
              {categories.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <button onClick={() => setCategory(c.name)} className="hover:text-[#C9A24B] transition-colors text-left">
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm tracking-elegant uppercase text-[#C9A24B] font-semibold mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm text-[#FBF6EC]/80">
              {contact?.email && (
                <li className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 text-[#C9A24B] flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-[#C9A24B] transition-colors break-all">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.phone && (
                <li className="flex items-start gap-2">
                  <Phone size={16} className="mt-0.5 text-[#C9A24B] flex-shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-[#C9A24B] transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.address && (
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-[#C9A24B] flex-shrink-0" />
                  <span>{contact.address}</span>
                </li>
              )}
              {whatsapp?.primaryNumber && (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp.primaryNumber.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#25D366] text-white text-xs tracking-elegant uppercase font-semibold rounded-md hover:bg-[#1FAE54] transition-colors"
                  >
                    <MessageCircle size={14} /> Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-gold my-10 opacity-50" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FBF6EC]/60">
          <p>© {new Date().getFullYear()} House of Neelam. All rights reserved. Handcrafted with love in India. 🪔</p>
          <div className="flex gap-6">
            <button onClick={() => openInfo("shipping")} className="hover:text-[#C9A24B] transition-colors">Shipping</button>
            <button onClick={() => openInfo("care")} className="hover:text-[#C9A24B] transition-colors">Care Guide</button>
            <button onClick={() => openInfo("privacy")} className="hover:text-[#C9A24B] transition-colors">Privacy</button>
            <button onClick={() => openInfo("terms")} className="hover:text-[#C9A24B] transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
