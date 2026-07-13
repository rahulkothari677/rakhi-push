// Theme system — 6 preset themes + custom theme support

export type Theme = {
  id: string
  name: string
  description: string
  colors: {
    primary: string      // Main brand color (burgundy)
    primaryDark: string  // Darker shade
    accent: string       // Gold accent
    accentDark: string   // Darker gold
    background: string   // Page background
    foreground: string   // Main text color
    muted: string        // Muted text
    card: string         // Card background
    border: string       // Border color
  }
  fonts: {
    serif: string        // Heading font
    sans: string         // Body font
  }
  preview: {
    bg: string
    text: string
    accent: string
  }
}

// 6 preset themes
export const PRESET_THEMES: Theme[] = [
  {
    id: "classic-burgundy",
    name: "Classic Burgundy",
    description: "Default — warm burgundy with antique gold on ivory",
    colors: {
      primary: "#8B1E3E",
      primaryDark: "#6B0E2A",
      accent: "#C9A24B",
      accentDark: "#B5862D",
      background: "#FBF6EC",
      foreground: "#2A0A0F",
      muted: "#6B5544",
      card: "#FFFFFF",
      border: "#E8D9B8",
    },
    fonts: {
      serif: "Playfair Display",
      sans: "Inter",
    },
    preview: { bg: "#FBF6EC", text: "#8B1E3E", accent: "#C9A24B" },
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    description: "Luxury jewelry feel — deep gold with black on cream",
    colors: {
      primary: "#B8860B",
      primaryDark: "#8B6914",
      accent: "#1A0508",
      accentDark: "#000000",
      background: "#FFF8E7",
      foreground: "#1A0508",
      muted: "#5C4A2E",
      card: "#FFFFFF",
      border: "#E5D5A8",
    },
    fonts: {
      serif: "Cormorant Garamond",
      sans: "Inter",
    },
    preview: { bg: "#FFF8E7", text: "#B8860B", accent: "#1A0508" },
  },
  {
    id: "festive-red",
    name: "Festive Red",
    description: "Raksha Bandhan festive — bright red with gold on white",
    colors: {
      primary: "#D32F2F",
      primaryDark: "#B71C1C",
      accent: "#FFD700",
      accentDark: "#FFA000",
      background: "#FFFAFA",
      foreground: "#1A0508",
      muted: "#6B5544",
      card: "#FFFFFF",
      border: "#FFCDD2",
    },
    fonts: {
      serif: "Playfair Display",
      sans: "Inter",
    },
    preview: { bg: "#FFFAFA", text: "#D32F2F", accent: "#FFD700" },
  },
  {
    id: "rose-pink",
    name: "Rose Pink",
    description: "Feminine & elegant — rose gold with pink on ivory",
    colors: {
      primary: "#C71585",
      primaryDark: "#9C0E6A",
      accent: "#B76E79",
      accentDark: "#9C5765",
      background: "#FFF5F7",
      foreground: "#3A1A2E",
      muted: "#7A5C6B",
      card: "#FFFFFF",
      border: "#F4D1DC",
    },
    fonts: {
      serif: "Cormorant Garamond",
      sans: "Inter",
    },
    preview: { bg: "#FFF5F7", text: "#C71585", accent: "#B76E79" },
  },
  {
    id: "midnight-premium",
    name: "Midnight Premium",
    description: "Night luxury — dark navy with gold on white",
    colors: {
      primary: "#1A237E",
      primaryDark: "#0D1356",
      accent: "#FFD700",
      accentDark: "#FFA000",
      background: "#FAFAFC",
      foreground: "#0D1356",
      muted: "#5C6280",
      card: "#FFFFFF",
      border: "#D5D9E8",
    },
    fonts: {
      serif: "Playfair Display",
      sans: "Inter",
    },
    preview: { bg: "#FAFAFC", text: "#1A237E", accent: "#FFD700" },
  },
  {
    id: "minimal-ivory",
    name: "Minimal Ivory",
    description: "Apple-like minimal — black with soft gold on pure white",
    colors: {
      primary: "#1A1A1A",
      primaryDark: "#000000",
      accent: "#C9A24B",
      accentDark: "#B5862D",
      background: "#FFFFFF",
      foreground: "#1A1A1A",
      muted: "#6B6B6B",
      card: "#FFFFFF",
      border: "#E5E5E5",
    },
    fonts: {
      serif: "Marcellus",
      sans: "Inter",
    },
    preview: { bg: "#FFFFFF", text: "#1A1A1A", accent: "#C9A24B" },
  },
]

// Available font options for custom theme builder
export const FONT_OPTIONS = {
  serif: [
    { name: "Playfair Display", value: "Playfair Display" },
    { name: "Cormorant Garamond", value: "Cormorant Garamond" },
    { name: "Lora", value: "Lora" },
    { name: "Marcellus", value: "Marcellus" },
    { name: "Cardo", value: "Cardo" },
  ],
  sans: [
    { name: "Inter", value: "Inter" },
    { name: "Source Sans Pro", value: "Source Sans Pro" },
    { name: "Lora", value: "Lora" },
    { name: "Crimson Text", value: "Crimson Text" },
  ],
}

// Get theme by ID
export function getThemeById(id: string): Theme | undefined {
  return PRESET_THEMES.find((t) => t.id === id)
}

// Apply theme to CSS variables on the document root
export function applyTheme(theme: Partial<Theme> | null) {
  if (typeof document === "undefined") return
  const root = document.documentElement

  if (!theme || !theme.colors) {
    // Reset to default (Classic Burgundy)
    const defaultTheme = PRESET_THEMES[0]
    applyTheme(defaultTheme)
    return
  }

  const { colors, fonts } = theme
  if (colors) {
    root.style.setProperty("--burgundy", colors.primary)
    root.style.setProperty("--burgundy-dark", colors.primaryDark || colors.primary)
    root.style.setProperty("--gold", colors.accent)
    root.style.setProperty("--gold-dark", colors.accentDark || colors.accent)
    root.style.setProperty("--ivory", colors.background)
    root.style.setProperty("--background", colors.background)
    root.style.setProperty("--foreground", colors.foreground)
    root.style.setProperty("--cream", colors.muted)
    root.style.setProperty("--card", colors.card)
    root.style.setProperty("--border", colors.border)
  }

  if (fonts) {
    root.style.setProperty("--font-serif", fonts.serif)
    root.style.setProperty("--font-sans", fonts.sans)
  }
}
