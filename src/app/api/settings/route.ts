import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJSON } from "@/lib/utils"

export async function GET() {
  const settings = await db.siteSetting.findMany()
  const result: Record<string, any> = {}
  for (const s of settings) {
    result[s.key] = parseJSON(s.value, null)
  }
  // Defaults if not set
  const defaults: Record<string, any> = {
    whatsapp: {
      primaryNumber: "+919504970435",
      secondaryNumbers: [],
      brandName: "House of Neelam",
    },
    contact: {
      email: "hello@houseofneelam.com",
      phone: "+919504970435",
      address: "India",
    },
    shipping: {
      freeAbove: 999,
      flatRate: 49,
      codAvailable: true,
    },
    social: {
      instagram: "",
      facebook: "",
      youtube: "",
      pinterest: "",
    },
    announcement: {
      enabled: true,
      text: "✨ Free shipping across India on orders above ₹999 • Handcrafted with love ✨",
    },
    branding: {
      tagline: "Rakhi Collection",
      establishedYear: "2024",
    },
  }
  return NextResponse.json({ settings: { ...defaults, ...result } })
}
