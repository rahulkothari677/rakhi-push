"use client"

import { useEffect } from "react"
import { applyTheme, getThemeById, type Theme } from "@/lib/themes"

// Loads the active theme from the database and applies it site-wide
export function ThemeLoader() {
  useEffect(() => {
    let mounted = true

    async function loadTheme() {
      try {
        const res = await fetch("/api/site-content?section=theme")
        const data = await res.json()

        if (!mounted) return

        if (data.data) {
          const themeData = data.data
          // If it's a preset ID, load the full theme
          if (themeData.presetId) {
            const preset = getThemeById(themeData.presetId)
            if (preset) {
              applyTheme(preset)
              return
            }
          }
          // Otherwise it's a custom theme
          applyTheme(themeData as Partial<Theme>)
        }
        // If no theme set, default is already applied via CSS
      } catch (e) {
        console.error("[ThemeLoader] Failed to load theme:", e)
      }
    }

    loadTheme()
    return () => {
      mounted = false
    }
  }, [])

  return null
}
