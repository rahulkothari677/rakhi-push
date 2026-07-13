"use client"

import { useStore } from "@/lib/store"
import { ArrowLeft, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

// BackButton — floating back button (less intrusive than a full bar)
export function BackButton() {
  const { view, canGoBack, goBack, goHome, isAdminOpen } = useStore()

  // Don't show on home page or when admin panel is open
  if (view === "home" || isAdminOpen) return null

  return (
    <div className="fixed top-28 sm:top-28 left-3 sm:left-6 z-30 flex items-center gap-2">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all backdrop-blur-sm",
          canGoBack
            ? "bg-white/90 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white hover:scale-110 border border-[var(--border)]"
            : "bg-white/50 text-[var(--muted-foreground)]/40 cursor-not-allowed border border-[var(--border)]/50"
        )}
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </button>

      <button
        onClick={goHome}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:scale-110 shadow-lg border border-[var(--border)] backdrop-blur-sm transition-all"
        aria-label="Go to home"
      >
        <Home size={16} />
      </button>
    </div>
  )
}

// BrowserHistorySync — integrates our navigation with the browser's back/forward buttons
// and adds mobile swipe-to-go-back gesture
export function BrowserHistorySync() {
  useEffect(() => {
    // Handle browser back button
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      const state = useStore.getState()
      if (state.navHistory.length > 0) {
        state.goBack()
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
