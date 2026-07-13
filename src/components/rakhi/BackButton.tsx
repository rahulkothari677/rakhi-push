"use client"

import { useStore } from "@/lib/store"
import { ArrowLeft, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

// BackButton — shown on all non-home pages
// Provides a visible back arrow + home button
export function BackButton() {
  const { view, canGoBack, goBack, goHome, isAdminOpen } = useStore()

  // Don't show on home page or when admin panel is open
  if (view === "home" || isAdminOpen) return null

  return (
    <div className="sticky top-20 z-30 px-4 sm:px-6 lg:px-8 py-3 bg-[#FBF6EC]/90 backdrop-blur-sm border-b border-[#E8D9B8]/50">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            canGoBack
              ? "text-[#8B1E3E] hover:bg-[#F4EAD5]"
              : "text-[#6B5544]/40 cursor-not-allowed"
          )}
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="h-4 w-px bg-[#E8D9B8]" />

        <button
          onClick={goHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[#6B5544] hover:text-[#8B1E3E] hover:bg-[#F4EAD5] transition-colors"
          aria-label="Go to home"
        >
          <Home size={14} />
          <span className="hidden sm:inline">Home</span>
        </button>
      </div>
    </div>
  )
}

// BrowserHistorySync — integrates our navigation with the browser's back/forward buttons
// and adds mobile swipe-to-go-back gesture
export function BrowserHistorySync() {
  const { goBack, goHome, navHistory, view } = useStore()

  useEffect(() => {
    // Handle browser back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      const state = useStore.getState()
      if (state.navHistory.length > 0) {
        state.goBack()
      } else {
        // Already at home — let browser do its thing (exit)
        // Don't prevent default so the browser can exit
      }
    }

    // Initialize browser history with a baseline state
    if (window.history.state === null) {
      window.history.replaceState({ nav: false, initial: true }, "")
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Mobile swipe-to-go-back gesture (swipe right from left edge)
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartX = touch.clientX
      touchStartY = touch.clientY
      touchStartTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartX
      const deltaY = touch.clientY - touchStartY
      const deltaTime = Date.now() - touchStartTime

      // Swipe right from left edge (within 50px of left edge)
      // Must be horizontal (deltaX > 80px, deltaX > abs(deltaY) * 2)
      // Must be quick (under 500ms)
      const state = useStore.getState()
      if (
        touchStartX < 50 &&
        deltaX > 80 &&
        deltaX > Math.abs(deltaY) * 2 &&
        deltaTime < 500 &&
        state.navHistory.length > 0
      ) {
        state.goBack()
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  return null
}
