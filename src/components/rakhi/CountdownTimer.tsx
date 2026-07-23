"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setConfig(d.settings?.festival))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!config) return
    if (!config.countdownEnabled) return

    const targetDate = new Date(config.countdownDate + "T00:00:00+05:30").getTime()

    const calculate = () => {
      const now = new Date().getTime()
      const diff = targetDate - now

      if (diff <= 0) {
        setIsExpired(true)
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [config])

  // Don't render if not loaded or disabled
  if (!config || !config.countdownEnabled) return null

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-[var(--primary)] via-[var(--primary-dark)] to-[var(--primary)] text-white py-3 text-center">
        <p className="text-sm font-bold flex items-center justify-center gap-2">
          <Sparkles size={16} /> Happy {config.countdownLabel || "Raksha Bandhan"}! 🪔✨
        </p>
      </div>
    )
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ]

  return (
    <div className="bg-gradient-to-r from-[var(--primary)] via-[var(--primary-dark)] to-[var(--primary)] text-white py-2.5 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, #FFD700 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 flex items-center justify-center gap-3 sm:gap-6">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Sparkles size={14} className="text-[#FFD700]" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide hidden sm:inline">{config.countdownLabel || "Raksha Bandhan"} in</span>
          <span className="text-[10px] sm:hidden font-semibold">{config.countdownLabel || "Rakhi"} in</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {units.map((unit, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-3">
              <div className="flex flex-col items-center">
                <motion.div
                  key={unit.value}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/20 backdrop-blur-sm rounded-md px-2 py-1 min-w-[32px] sm:min-w-[40px] text-center"
                >
                  <span className="text-sm sm:text-lg font-bold tabular-nums">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                </motion.div>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-wide text-white/70 mt-0.5">
                  {unit.label}
                </span>
              </div>
              {i < units.length - 1 && <span className="text-white/40 text-sm sm:text-lg">:</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
