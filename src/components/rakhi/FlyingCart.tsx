"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type FlyingItem = {
  id: string
  imageSrc: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

let flyingItems: FlyingItem[] = []
let listeners: Array<() => void> = []

function notify() {
  listeners.forEach((l) => l())
}

/**
 * Trigger a flying-to-cart animation.
 * Call this from a product card's add-to-cart handler, passing the click event
 * and the product's primary image. The image will animate from the click point
 * to the cart icon in the header.
 */
export function flyToCart(e: React.MouseEvent, imageSrc: string) {
  if (typeof window === "undefined") return

  // Find the cart button in the header
  const cartButton = document.querySelector('[aria-label="Cart"]') as HTMLElement | null
  if (!cartButton) return

  const cartRect = cartButton.getBoundingClientRect()
  const fromX = e.clientX
  const fromY = e.clientY
  const toX = cartRect.left + cartRect.width / 2
  const toY = cartRect.top + cartRect.height / 2

  const item: FlyingItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageSrc,
    fromX,
    fromY,
    toX,
    toY,
  }

  flyingItems = [...flyingItems, item]
  notify()

  // Remove after animation completes (700ms)
  setTimeout(() => {
    flyingItems = flyingItems.filter((i) => i.id !== item.id)
    notify()
  }, 750)
}

/**
 * Hook to subscribe to flying items state. Use this in the FlyingCartOverlay component.
 */
export function useFlyingItems() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return flyingItems
}

/**
 * Render the flying items overlay. Mount this once at the app root.
 */
export function FlyingCartOverlay() {
  const items = useFlyingItems()

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {items.map((item) => (
          <motion.img
            key={item.id}
            src={item.imageSrc}
            alt=""
            initial={{
              position: "fixed",
              left: item.fromX - 30,
              top: item.fromY - 30,
              width: 60,
              height: 60,
              opacity: 1,
              scale: 1,
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 8px 25px rgba(139,30,62,0.4)",
              border: "2px solid var(--accent)",
            }}
            animate={{
              left: item.toX - 20,
              top: item.toY - 20,
              width: 40,
              height: 40,
              opacity: [1, 1, 0.8, 0],
              scale: [1, 0.9, 0.7, 0.3],
            }}
            transition={{
              duration: 0.7,
              ease: [0.5, 0, 0.5, 1], // ease-in for the "drop" feel
              times: [0, 0.4, 0.8, 1],
            }}
            style={{
              position: "fixed",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
