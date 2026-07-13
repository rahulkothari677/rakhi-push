"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { X, Lock, Mail, Sparkles } from "lucide-react"

export function AdminLogin({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("Invalid email or password. Please try again.")
      setLoading(false)
    } else {
      // Wait briefly for session to propagate, then reload
      await new Promise((r) => setTimeout(r, 500))
      window.location.href = "/"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#FBF6EC] rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-[#F4EAD5] flex items-center justify-center"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#8B1E3E] to-[#6B0E2A] flex items-center justify-center">
            <Sparkles size={24} className="text-[#C9A24B]" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#2A0A0F]">
            Admin <span className="text-gradient-burgundy italic">Login</span>
          </h2>
          <p className="text-sm text-[#6B5544] mt-1">
            House of Neelam — Management Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5544]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@houseofneelam.com"
                className="w-full pl-10 pr-3 py-2.5 border border-[#E8D9B8] rounded-md text-sm bg-white outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs tracking-elegant uppercase text-[#C9A24B] font-semibold mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5544]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-[#E8D9B8] rounded-md text-sm bg-white outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-[#B3324A]/10 text-[#B3324A] text-sm rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#8B1E3E] text-[#FBF6EC] text-sm tracking-elegant uppercase font-semibold rounded-md hover:bg-[#6B0E2A] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In to Admin"}
          </button>
        </form>

        <div className="mt-6 p-3 bg-[#F4EAD5] rounded-md text-xs text-[#6B5544] text-center">
          <p className="font-semibold text-[#2A0A0F] mb-1">Demo Admin Credentials:</p>
          <p>Email: <span className="font-mono text-[#8B1E3E]">admin@houseofneelam.com</span></p>
          <p>Password: <span className="font-mono text-[#8B1E3E]">Neelam@Admin2026</span></p>
        </div>
      </motion.div>
    </motion.div>
  )
}
