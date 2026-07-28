"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, Send, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

type Message = {
  role: "user" | "assistant"
  content: string
  filter?: {
    category?: string | null
    searchQuery?: string | null
    maxPrice?: number | null
  } | null
  suggestions?: string[]
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Namaste! 🙏 I'm Neelam, your personal Rakhi shopping assistant. Looking for the perfect Rakhi for your sibling? Tell me about them — age, your budget, or the style you want — and I'll help you find it!",
  suggestions: [
    "Rakhi for my 5-year-old brother",
    "Premium Rakhi under ₹1500",
    "Lumba for bhabhi with pearls",
  ],
}

export function AiShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setCategory, setSearchQuery, openProduct } = useStore()

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 250)
    }
  }, [isOpen])

  // Show "new message" badge when assistant replies and chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 1 && messages[messages.length - 1].role === "assistant") {
      setHasNewMessage(true)
    }
  }, [messages, isOpen])

  const applyFilter = (filter: NonNullable<Message["filter"]>) => {
    if (filter.category) {
      setCategory(filter.category)
      setIsOpen(false)
      toast.success("Showing recommendations", {
        description: filter.category,
        duration: 2500,
      })
    } else if (filter.searchQuery) {
      setSearchQuery(filter.searchQuery)
      setIsOpen(false)
      toast.success("Searching products", {
        description: filter.searchQuery,
        duration: 2500,
      })
    }
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: "user", content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/shopping-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply || "I'm sorry, I didn't catch that. Could you rephrase?",
        filter: data.filter || null,
        suggestions: data.suggestions || [],
      }
      setMessages([...newMessages, assistantMsg])
    } catch (e: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again, or use the search bar to find Rakhis directly.",
          suggestions: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating chat button — replaces/augments the WhatsApp button area */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen)
          setHasNewMessage(false)
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-luxe-hover flex items-center justify-center relative"
        aria-label="Open AI Shopping Assistant"
      >
        {isOpen ? <X size={22} /> : <Sparkles size={22} />}
        {!isOpen && hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-[var(--foreground)] text-[10px] font-bold rounded-full flex items-center justify-center animate-badge-pop">
            1
          </span>
        )}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[var(--primary)] animate-ping opacity-20" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-4 sm:bottom-40 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-2xl shadow-[0_25px_60px_rgba(139,30,62,0.25)] border border-[var(--border)] overflow-hidden flex flex-col"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div className="flex-1">
                <div className="font-serif text-lg leading-tight">Neelam</div>
                <div className="text-xs text-white/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  AI Shopping Assistant · Online
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--background)]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                    <div
                      className={
                        msg.role === "user"
                          ? "bg-[var(--primary)] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                          : "bg-white text-[var(--foreground)] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-[var(--border)] shadow-sm"
                      }
                    >
                      {msg.content.split("\n").map((line, j) => (
                        <p key={j} className={j > 0 ? "mt-1.5" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Show "View Rakhis" button if assistant returned a filter */}
                    {msg.role === "assistant" && msg.filter && (msg.filter.category || msg.filter.searchQuery) && (
                      <button
                        onClick={() => applyFilter(msg.filter!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-[var(--foreground)] text-xs font-semibold rounded-full hover:bg-[var(--accent)]/80 transition-colors w-fit"
                      >
                        <ShoppingBag size={12} />
                        View {msg.filter.category || `"${msg.filter.searchQuery}"`} Rakhis
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {/* Suggestions */}
                    {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((s, j) => (
                          <button
                            key={j}
                            onClick={() => sendMessage(s)}
                            className="px-3 py-1.5 bg-white border border-[var(--accent)]/40 text-[var(--primary)] text-xs rounded-full hover:bg-[var(--cream)] transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Loader2 size={14} className="animate-spin" />
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border)] p-3 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage(input)
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Rakhis, traditions, gifting..."
                  className="flex-1 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-full text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 flex-shrink-0 bg-[var(--primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <p className="text-[10px] text-[var(--muted-foreground)] text-center mt-1.5">
                Powered by AI · May produce inaccurate info about products
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
