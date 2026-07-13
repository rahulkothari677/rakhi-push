// Generate beautiful SVG placeholder images for Rakhi catalog
// Run: bun run scripts/generate-images.ts

import { promises as fs } from "fs"
import path from "path"

const OUTPUT_DIR = path.join(process.cwd(), "public", "images")

const COLORS = {
  burgundy: "#8B1E3E",
  burgundyDark: "#6B0E2A",
  burgundyLight: "#A8425B",
  gold: "#C9A24B",
  goldLight: "#E6C373",
  goldDark: "#B5862D",
  ivory: "#FBF6EC",
  cream: "#F4EAD5",
  brown: "#6B5544",
  red: "#B3324A",
  silver: "#C0C0C0",
  silverDark: "#A8A8A8",
  rose: "#D4A5A5",
  green: "#5C8C3E",
}

function svgWrap(content: string, w = 800, h = 800): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg-grad" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${COLORS.cream}"/>
      <stop offset="100%" stop-color="${COLORS.ivory}"/>
    </radialGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.goldDark}"/>
      <stop offset="50%" stop-color="${COLORS.goldLight}"/>
      <stop offset="100%" stop-color="${COLORS.gold}"/>
    </linearGradient>
    <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.silverDark}"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="${COLORS.silver}"/>
    </linearGradient>
    <linearGradient id="burgundy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.burgundyLight}"/>
      <stop offset="100%" stop-color="${COLORS.burgundyDark}"/>
    </linearGradient>
    <filter id="soft-shadow">
      <feGaussianBlur stdDeviation="3"/>
      <feOffset dx="2" dy="4" result="offsetblur"/>
      <feFlood flood-color="#000000" flood-opacity="0.2"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg-grad)"/>
  ${content}
</svg>`
}

// Central decorative ornament motif for premium feel
function ornament(): string {
  return `
  <!-- Decorative mandala-inspired ornament -->
  <g transform="translate(400, 400)" filter="url(#soft-shadow)">
    <!-- Outer ring -->
    <circle r="180" fill="none" stroke="url(#gold-grad)" stroke-width="2" opacity="0.4"/>
    <circle r="160" fill="none" stroke="url(#gold-grad)" stroke-width="1" opacity="0.6"/>
    
    <!-- Petal motifs around -->
    ${Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30) * Math.PI / 180
      const x = Math.cos(angle) * 130
      const y = Math.sin(angle) * 130
      return `<g transform="translate(${x}, ${y}) rotate(${i * 30})">
        <ellipse cx="0" cy="0" rx="20" ry="8" fill="url(#gold-grad)" opacity="0.7"/>
        <circle cx="0" cy="0" r="3" fill="${COLORS.burgundy}"/>
      </g>`
    }).join("")}
  </g>`
}

function rakhiImage(opts: {
  centerColor: string
  ringColor: string
  motif: string
  label?: string
  variant?: number
}): string {
  const { centerColor, ringColor, motif, label, variant = 1 } = opts
  return svgWrap(`
    <!-- Decorative background petals (top) -->
    <g opacity="0.15" transform="translate(400, 200)">
      ${Array.from({ length: 7 }).map((_, i) => {
        const x = -180 + i * 60
        return `<ellipse cx="${x}" cy="0" rx="22" ry="10" fill="${COLORS.burgundy}" transform="rotate(${-30 + i * 10} ${x} 0)"/>`
      }).join("")}
    </g>

    <!-- Thread strands (left and right) -->
    <g>
      <!-- Left threads -->
      <path d="M 50 400 Q 200 380 280 400" stroke="${COLORS.burgundy}" stroke-width="3" fill="none"/>
      <path d="M 50 420 Q 200 400 280 420" stroke="${COLORS.gold}" stroke-width="2" fill="none"/>
      <path d="M 50 380 Q 200 360 280 380" stroke="${COLORS.burgundyDark}" stroke-width="2" fill="none" opacity="0.7"/>
      
      <!-- Right threads -->
      <path d="M 520 400 Q 600 380 750 400" stroke="${COLORS.burgundy}" stroke-width="3" fill="none"/>
      <path d="M 520 420 Q 600 400 750 420" stroke="${COLORS.gold}" stroke-width="2" fill="none"/>
      <path d="M 520 380 Q 600 360 750 380" stroke="${COLORS.burgundyDark}" stroke-width="2" fill="none" opacity="0.7"/>
    </g>

    <!-- Decorative beads on threads -->
    ${Array.from({ length: 5 }).map((_, i) => {
      const x = 80 + i * 40
      return `<circle cx="${x}" cy="400" r="4" fill="url(#gold-grad)"/>`
    }).join("")}
    ${Array.from({ length: 5 }).map((_, i) => {
      const x = 560 + i * 40
      return `<circle cx="${x}" cy="400" r="4" fill="url(#gold-grad)"/>`
    }).join("")}

    <!-- Center medallion -->
    <g transform="translate(400, 400)" filter="url(#soft-shadow)">
      <!-- Outer ring -->
      <circle r="120" fill="${centerColor}" stroke="url(#${ringColor})" stroke-width="4"/>
      <circle r="100" fill="none" stroke="url(#${ringColor})" stroke-width="1.5" opacity="0.6"/>
      
      <!-- Petal motif around center -->
      ${Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45) * Math.PI / 180
        const x = Math.cos(angle) * 95
        const y = Math.sin(angle) * 95
        return `<g transform="translate(${x}, ${y}) rotate(${i * 45})">
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="url(#${ringColor})" opacity="0.7"/>
        </g>`
      }).join("")}
      
      <!-- Center motif -->
      ${motif}
    </g>

    ${label ? `<text x="400" y="720" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-style="italic" fill="${COLORS.burgundy}" font-weight="600">${label}</text>` : ""}
  `)
}

// SVG motifs for different rakhi types
const motifs = {
  peacock: `
    <!-- Peacock motif -->
    <g transform="scale(0.7)">
      <ellipse cx="0" cy="-20" rx="20" ry="35" fill="url(#gold-grad)"/>
      <circle cx="0" cy="-40" r="14" fill="url(#burgundy-grad)"/>
      <!-- Peacock feathers -->
      ${Array.from({ length: 5 }).map((_, i) => {
        const angle = (-60 + i * 30) * Math.PI / 180
        const x = Math.cos(angle) * 50
        const y = Math.sin(angle) * 50 - 10
        return `<g transform="translate(${x}, ${y}) rotate(${-60 + i * 30})">
          <ellipse cx="0" cy="0" rx="8" ry="22" fill="url(#gold-grad)" opacity="0.8"/>
          <circle cx="0" cy="-15" r="6" fill="${COLORS.burgundy}"/>
          <circle cx="0" cy="-15" r="3" fill="${COLORS.gold}"/>
        </g>`
      }).join("")}
    </g>`,
  lotus: `
    <!-- Lotus motif -->
    <g transform="scale(0.85)">
      ${Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45) * Math.PI / 180
        return `<g transform="rotate(${i * 45})">
          <path d="M 0 -60 Q -15 -30 0 -10 Q 15 -30 0 -60" fill="url(#silver-grad)" opacity="0.85"/>
        </g>`
      }).join("")}
      <circle r="12" fill="${COLORS.gold}"/>
      <circle r="6" fill="${COLORS.burgundy}"/>
    </g>`,
  swirl: `
    <!-- Designer swirl -->
    <g transform="scale(0.9)">
      <circle r="40" fill="none" stroke="url(#gold-grad)" stroke-width="3"/>
      <circle r="25" fill="url(#gold-grad)" opacity="0.7"/>
      <circle r="15" fill="${COLORS.burgundy}"/>
      <!-- Sparkles -->
      <g fill="${COLORS.gold}">
        <circle cx="-30" cy="-30" r="3"/>
        <circle cx="30" cy="-30" r="3"/>
        <circle cx="-30" cy="30" r="3"/>
        <circle cx="30" cy="30" r="3"/>
      </g>
    </g>`,
  star: `
    <!-- Star/Sparkle for kids -->
    <g transform="scale(0.9)">
      <path d="M 0 -60 L 18 -18 L 60 -18 L 26 8 L 38 50 L 0 22 L -38 50 L -26 8 L -60 -18 L -18 -18 Z" 
            fill="url(#gold-grad)" stroke="${COLORS.burgundy}" stroke-width="2"/>
      <circle r="15" fill="${COLORS.burgundy}"/>
      <text y="5" text-anchor="middle" font-size="18" fill="${COLORS.gold}">★</text>
    </g>`,
  diamond: `
    <!-- Diamond/luxury -->
    <g transform="scale(0.85)">
      <path d="M 0 -50 L 35 -15 L 0 50 L -35 -15 Z" fill="url(#gold-grad)" stroke="${COLORS.burgundy}" stroke-width="2"/>
      <path d="M 0 -30 L 20 -10 L 0 30 L -20 -10 Z" fill="url(#silver-grad)" opacity="0.6"/>
      <circle r="8" fill="${COLORS.burgundy}"/>
      <!-- Outer diamonds -->
      ${[0, 90, 180, 270].map(deg => {
        const r = (deg) * Math.PI / 180
        const x = Math.cos(r) * 60
        const y = Math.sin(r) * 60
        return `<g transform="translate(${x}, ${y})">
          <path d="M 0 -8 L 6 -2 L 0 8 L -6 -2 Z" fill="url(#gold-grad)"/>
        </g>`
      }).join("")}
    </g>`,
  bell: `
    <!-- Temple bell -->
    <g transform="scale(0.85)">
      <path d="M -25 -30 Q -25 -50 0 -50 Q 25 -50 25 -30 L 30 10 L -30 10 Z" fill="url(#gold-grad)" stroke="${COLORS.burgundy}" stroke-width="2"/>
      <rect x="-5" y="-55" width="10" height="6" fill="${COLORS.burgundy}"/>
      <circle cy="20" r="6" fill="${COLORS.burgundy}"/>
    </g>`,
  macrame: `
    <!-- Macrame knot pattern -->
    <g transform="scale(0.85)" stroke="${COLORS.brown}" stroke-width="2" fill="none">
      <circle r="50" stroke-width="0"/>
      <path d="M -40 -30 Q 0 -50 40 -30 Q 50 0 40 30 Q 0 50 -40 30 Q -50 0 -40 -30"/>
      <path d="M -25 -25 Q 0 -35 25 -25 Q 30 0 25 25 Q 0 35 -25 25 Q -30 0 -25 -25"/>
      <circle r="8" fill="${COLORS.gold}" stroke="none"/>
    </g>`,
  heart: `
    <!-- Heart for personalized -->
    <g transform="scale(0.8)">
      <path d="M 0 30 C -40 0 -40 -40 0 -20 C 40 -40 40 0 0 30 Z" fill="url(#burgundy-grad)" stroke="url(#gold-grad)" stroke-width="2"/>
      <text y="-5" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${COLORS.gold}" font-style="italic">Name</text>
    </g>`,
  lumba: `
    <!-- Lumba (pendant style) -->
    <g transform="scale(0.85)">
      <ellipse cx="0" cy="-20" rx="35" ry="25" fill="url(#burgundy-grad)" stroke="url(#gold-grad)" stroke-width="2"/>
      <!-- Pearl drops -->
      ${[-30, -10, 10, 30].map(x => 
        `<g transform="translate(${x}, 15)">
          <line y1="0" y2="20" stroke="${COLORS.gold}" stroke-width="1"/>
          <circle cy="25" r="4" fill="url(#silver-grad)"/>
        </g>`
      ).join("")}
      <circle cy="-20" r="8" fill="${COLORS.gold}"/>
    </g>`,
  thali: `
    <!-- Thali (plate) -->
    <g transform="scale(0.85)">
      <circle r="80" fill="url(#gold-grad)" stroke="${COLORS.burgundy}" stroke-width="3"/>
      <circle r="65" fill="none" stroke="${COLORS.burgundy}" stroke-width="1" opacity="0.6"/>
      <!-- Small bowls -->
      <circle cx="-30" cy="-30" r="15" fill="${COLORS.burgundy}" stroke="${COLORS.gold}" stroke-width="1.5"/>
      <circle cx="30" cy="-30" r="15" fill="${COLORS.cream}" stroke="${COLORS.gold}" stroke-width="1.5"/>
      <!-- Diya (lamp) -->
      <ellipse cy="20" rx="20" ry="8" fill="${COLORS.gold}"/>
      <ellipse cy="15" rx="6" ry="10" fill="${COLORS.burgundy}"/>
    </g>`,
  bowls: `
    <!-- Roli-chawal bowls -->
    <g transform="scale(0.85)">
      <ellipse cx="-30" cy="0" rx="35" ry="20" fill="url(#silver-grad)" stroke="${COLORS.burgundy}" stroke-width="2"/>
      <ellipse cx="-30" cy="-5" rx="25" ry="12" fill="${COLORS.burgundy}" opacity="0.8"/>
      <ellipse cx="30" cy="0" rx="35" ry="20" fill="url(#silver-grad)" stroke="${COLORS.burgundy}" stroke-width="2"/>
      <ellipse cx="30" cy="-5" rx="25" ry="12" fill="${COLORS.cream}" opacity="0.9"/>
    </g>`,
  marigold: `
    <!-- Marigold flower -->
    <g transform="scale(0.85)">
      ${Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * Math.PI / 180
        const x = Math.cos(angle) * 35
        const y = Math.sin(angle) * 35
        return `<g transform="translate(${x}, ${y}) rotate(${i * 30})">
          <ellipse cx="0" cy="0" rx="15" ry="25" fill="${COLORS.gold}" opacity="0.85"/>
        </g>`
      }).join("")}
      <circle r="18" fill="${COLORS.burgundy}"/>
      <circle r="10" fill="${COLORS.gold}"/>
    </g>`,
  paw: `
    <!-- Paw print for kids puppy -->
    <g transform="scale(0.85)" fill="${COLORS.burgundy}">
      <ellipse cx="0" cy="15" rx="25" ry="20"/>
      <circle cx="-25" cy="-15" r="10"/>
      <circle cx="0" cy="-25" r="10"/>
      <circle cx="25" cy="-15" r="10"/>
    </g>`,
}

// Generate all images
async function generateAll() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Product images (each product gets 2 variants)
  const productImages: Record<string, { motif: string; centerColor: string; ringColor: string }> = {
    "rakhi-gold-peacock": { motif: motifs.peacock, centerColor: COLORS.burgundy, ringColor: "gold-grad" },
    "rakhi-silver-lotus": { motif: motifs.lotus, centerColor: COLORS.cream, ringColor: "silver-grad" },
    "rakhi-lumba-velvet": { motif: motifs.lumba, centerColor: COLORS.burgundyDark, ringColor: "gold-grad" },
    "rakhi-traditional-moli": { motif: motifs.bell, centerColor: COLORS.burgundy, ringColor: "gold-grad" },
    "rakhi-designer-crystal": { motif: motifs.swirl, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "rakhi-kids-superhero": { motif: motifs.star, centerColor: COLORS.red, ringColor: "gold-grad" },
    "rakhi-kids-puppy": { motif: motifs.paw, centerColor: COLORS.burgundy, ringColor: "gold-grad" },
    "rakhi-handmade-macrame": { motif: motifs.macrame, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "rakhi-personalized-name": { motif: motifs.heart, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "rakhi-premium-diamond": { motif: motifs.diamond, centerColor: COLORS.burgundy, ringColor: "gold-grad" },
    "rakhi-traditional-temple": { motif: motifs.bell, centerColor: COLORS.brown, ringColor: "gold-grad" },
    "rakhi-lumba-pearl": { motif: motifs.lumba, centerColor: COLORS.cream, ringColor: "silver-grad" },
    "thali-roli-chawal": { motif: motifs.thali, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "roli-chawal-bowls": { motif: motifs.bowls, centerColor: COLORS.cream, ringColor: "silver-grad" },
    "thali-marigold": { motif: motifs.marigold, centerColor: COLORS.cream, ringColor: "gold-grad" },
  }

  for (const [name, config] of Object.entries(productImages)) {
    // Variant 1
    const svg1 = rakhiImage({ ...config, variant: 1 })
    await fs.writeFile(path.join(OUTPUT_DIR, `${name}-1.svg`), svg1)
    // Variant 2 (slightly different angle/colors)
    const svg2 = rakhiImage({ 
      ...config, 
      centerColor: config.centerColor === COLORS.burgundy ? COLORS.burgundyDark : config.centerColor,
      variant: 2 
    })
    await fs.writeFile(path.join(OUTPUT_DIR, `${name}-2.svg`), svg2)
  }
  console.log("✅ Generated 30 product images")

  // Category images
  const categoryImages: Record<string, { motif: string; centerColor: string; ringColor: string }> = {
    "category-1": { motif: motifs.bell, centerColor: COLORS.burgundy, ringColor: "gold-grad" },
    "category-2": { motif: motifs.swirl, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "category-3": { motif: motifs.star, centerColor: COLORS.red, ringColor: "gold-grad" },
    "category-4": { motif: motifs.lumba, centerColor: COLORS.burgundyDark, ringColor: "gold-grad" },
    "category-5": { motif: motifs.peacock, centerColor: COLORS.burgundy, ringColor: "gold-grad" },
    "category-6": { motif: motifs.lotus, centerColor: COLORS.cream, ringColor: "silver-grad" },
    "category-7": { motif: motifs.macrame, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "category-8": { motif: motifs.heart, centerColor: COLORS.cream, ringColor: "gold-grad" },
    "category-9": { motif: motifs.thali, centerColor: COLORS.cream, ringColor: "gold-grad" },
  }
  for (const [name, config] of Object.entries(categoryImages)) {
    const svg = rakhiImage({ ...config, label: "" })
    await fs.writeFile(path.join(OUTPUT_DIR, `${name}.svg`), svg)
  }
  console.log("✅ Generated 9 category images")

  // Hero slides (1200x600)
  const hero1 = svgWrap(`
    <g transform="translate(600, 300)">
      <!-- Big ornate rakhi on left -->
      <g transform="translate(-200, 0) scale(1.2)" filter="url(#soft-shadow)">
        <circle r="130" fill="${COLORS.burgundy}" stroke="url(#gold-grad)" stroke-width="4"/>
        <circle r="110" fill="none" stroke="url(#gold-grad)" stroke-width="1.5" opacity="0.6"/>
        ${Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * Math.PI / 180
          const x = Math.cos(angle) * 100
          const y = Math.sin(angle) * 100
          return `<g transform="translate(${x}, ${y}) rotate(${i * 30})">
            <ellipse cx="0" cy="0" rx="16" ry="7" fill="url(#gold-grad)" opacity="0.7"/>
          </g>`
        }).join("")}
        ${motifs.peacock}
      </g>
      <!-- Decorative threads -->
      <path d="M -50 0 Q 100 -50 250 0" stroke="${COLORS.burgundy}" stroke-width="3" fill="none"/>
      <path d="M -50 30 Q 100 -20 250 30" stroke="url(#gold-grad)" stroke-width="2" fill="none"/>
    </g>
    <!-- Scattered petals -->
    ${Array.from({ length: 8 }).map((_, i) => {
      const x = 200 + (i * 90) % 700
      const y = 100 + (i * 70) % 400
      return `<ellipse cx="${x}" cy="${y}" rx="12" ry="6" fill="${COLORS.burgundy}" opacity="0.2" transform="rotate(${i * 45} ${x} ${y})"/>`
    }).join("")}
  `, 1200, 600)

  const hero2 = svgWrap(`
    <g transform="translate(600, 300)">
      <!-- Silver rakhi prominent -->
      <g transform="translate(0, 0) scale(1.3)" filter="url(#soft-shadow)">
        <circle r="140" fill="${COLORS.cream}" stroke="url(#silver-grad)" stroke-width="4"/>
        <circle r="120" fill="none" stroke="url(#silver-grad)" stroke-width="1.5" opacity="0.6"/>
        ${Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * Math.PI / 180
          const x = Math.cos(angle) * 110
          const y = Math.sin(angle) * 110
          return `<g transform="translate(${x}, ${y}) rotate(${i * 30})">
            <ellipse cx="0" cy="0" rx="16" ry="7" fill="url(#silver-grad)" opacity="0.7"/>
          </g>`
        }).join("")}
        ${motifs.lotus}
      </g>
      <!-- Golden sparkles -->
      ${Array.from({ length: 15 }).map(() => {
        const x = Math.random() * 1200
        const y = Math.random() * 600
        return `<circle cx="${x}" cy="${y}" r="2" fill="${COLORS.gold}" opacity="0.6"/>`
      }).join("")}
    </g>
  `, 1200, 600)

  const hero3 = svgWrap(`
    <g transform="translate(600, 300)">
      <!-- Two rakhis side by side (bhaiya + bhabhi) -->
      <g transform="translate(-150, 0) scale(0.9)" filter="url(#soft-shadow)">
        <circle r="110" fill="${COLORS.burgundy}" stroke="url(#gold-grad)" stroke-width="3"/>
        ${motifs.peacock}
      </g>
      <g transform="translate(150, 0) scale(0.9)" filter="url(#soft-shadow)">
        <circle r="110" fill="${COLORS.cream}" stroke="url(#gold-grad)" stroke-width="3"/>
        ${motifs.lumba}
      </g>
      <!-- Connecting thread -->
      <path d="M -40 0 Q 0 30 40 0" stroke="url(#gold-grad)" stroke-width="2" fill="none"/>
      <!-- Pearl drops -->
      ${Array.from({ length: 6 }).map((_, i) => {
        const x = -40 + i * 16
        const y = Math.sin(i) * 8
        return `<circle cx="${x}" cy="${y}" r="3" fill="url(#silver-grad)"/>`
      }).join("")}
    </g>
  `, 1200, 600)

  await fs.writeFile(path.join(OUTPUT_DIR, "hero-1.svg"), hero1)
  await fs.writeFile(path.join(OUTPUT_DIR, "hero-2.svg"), hero2)
  await fs.writeFile(path.join(OUTPUT_DIR, "hero-3.svg"), hero3)
  console.log("✅ Generated 3 hero slides")

  // About image
  const about = svgWrap(`
    <g transform="translate(400, 400)">
      <circle r="200" fill="url(#bg-grad)" stroke="url(#gold-grad)" stroke-width="2" opacity="0.5"/>
      <circle r="160" fill="none" stroke="url(#gold-grad)" stroke-width="1" opacity="0.4"/>
      <!-- Brand monogram "N" -->
      <text y="50" text-anchor="middle" font-family="Georgia, serif" font-size="200" font-weight="700" fill="url(#burgundy-grad)" font-style="italic">N</text>
      <text y="120" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${COLORS.gold}" letter-spacing="8">HOUSE OF NEELAM</text>
    </g>
  `)
  await fs.writeFile(path.join(OUTPUT_DIR, "about.svg"), about)
  console.log("✅ Generated about image")

  // Favicon
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="12" fill="${COLORS.burgundy}"/>
    <text x="32" y="46" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="700" fill="${COLORS.gold}" font-style="italic">N</text>
  </svg>`
  await fs.writeFile(path.join(process.cwd(), "public", "favicon.svg"), favicon)
  console.log("✅ Generated favicon")
}

generateAll().catch((e) => {
  console.error(e)
  process.exit(1)
})
