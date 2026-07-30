"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Upload, Loader2, Check, AlertCircle, Sparkles, Image as ImageIcon,
  RefreshCw, SkipForward, Package, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Category = {
  id: string
  name: string
  productCount: number
}

type BulkItem = {
  id: string
  file: File
  previewUrl: string
  status: "pending" | "uploading" | "analyzing" | "creating" | "done" | "error"
  progress: number // 0-100
  result?: {
    success: boolean
    productName?: string
    price?: number
    category?: string
    productId?: string
    productSlug?: string
    imageUrl?: string
    error?: string
    analysis?: any
  }
}

type BulkUploadProps = {
  categories: Category[]
  onDone: () => void
  onClose: () => void
}

export function BulkUpload({ categories, onDone, onClose }: BulkUploadProps) {
  const [items, setItems] = useState<BulkItem[]>([])
  const [defaultCategory, setDefaultCategory] = useState<string>(categories[0]?.name || "")
  const [defaultPrice, setDefaultPrice] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    const newItems: BulkItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "pending" as const,
        progress: 0,
      }))
    setItems((prev) => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  const updateItem = (id: string, updates: Partial<BulkItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  const processAll = async () => {
    if (items.length === 0) return
    setIsProcessing(true)
    setHasStarted(true)

    // Mark all as uploading
    items.forEach((i) => updateItem(i.id, { status: "uploading", progress: 10 }))

    try {
      const fd = new FormData()
      items.forEach((i) => fd.append("files", i.file))
      if (defaultCategory) fd.append("defaultCategory", defaultCategory)
      if (defaultPrice) fd.append("defaultPrice", defaultPrice)

      // Update progress as we wait (simulated phases)
      const progressInterval = setInterval(() => {
        setItems((prev) =>
          prev.map((i) => {
            if (i.status === "uploading" && i.progress < 40) {
              return { ...i, progress: i.progress + 5 }
            }
            if (i.status === "analyzing" && i.progress < 80) {
              return { ...i, progress: i.progress + 3 }
            }
            if (i.status === "creating" && i.progress < 95) {
              return { ...i, progress: i.progress + 2 }
            }
            return i
          })
        )
      }, 800)

      // Mark as analyzing
      setTimeout(() => {
        setItems((prev) => prev.map((i) => (i.status === "uploading" ? { ...i, status: "analyzing", progress: 50 } : i)))
      }, 1500)

      const res = await fetch("/api/ai/bulk-upload", {
        method: "POST",
        body: fd,
      })

      clearInterval(progressInterval)

      const data = await res.json()

      if (!res.ok) {
        toast.error("Bulk upload failed", {
          description: data.error || "Unknown error",
          duration: 5000,
        })
        // Mark all as error
        setItems((prev) => prev.map((i) => ({ ...i, status: "error", progress: 100, result: { success: false, error: data.error } })))
        setIsProcessing(false)
        return
      }

      // Update each item with its result
      data.results.forEach((result: any, index: number) => {
        const item = items[index]
        if (item) {
          updateItem(item.id, {
            status: result.success ? "done" : "error",
            progress: 100,
            result,
          })
        }
      })

      const successCount = data.summary.success
      const failCount = data.summary.failed

      if (successCount > 0) {
        toast.success(`Created ${successCount} product${successCount !== 1 ? "s" : ""}!`, {
          description: failCount > 0 ? `${failCount} failed — you can retry those` : "All images processed successfully",
          duration: 4000,
          icon: <Check size={18} className="text-white" />,
          style: { background: "var(--primary)", color: "white", border: "none" },
        })
      } else {
        toast.error("All items failed", {
          description: "Check the errors below and retry",
          duration: 5000,
        })
      }
    } catch (e: any) {
      toast.error("Bulk upload failed", {
        description: e.message,
        duration: 5000,
      })
      setItems((prev) => prev.map((i) => ({ ...i, status: "error", progress: 100, result: { success: false, error: e.message } })))
    } finally {
      setIsProcessing(false)
    }
  }

  const retryFailed = async () => {
    const failedItems = items.filter((i) => i.status === "error")
    if (failedItems.length === 0) return

    // Reset failed items to pending
    failedItems.forEach((i) => updateItem(i.id, { status: "pending", progress: 0, result: undefined }))

    // Create a new bulk upload with just the failed items
    setIsProcessing(true)
    try {
      const fd = new FormData()
      failedItems.forEach((i) => fd.append("files", i.file))
      if (defaultCategory) fd.append("defaultCategory", defaultCategory)
      if (defaultPrice) fd.append("defaultPrice", defaultPrice)

      failedItems.forEach((i) => updateItem(i.id, { status: "uploading", progress: 10 }))

      const progressInterval = setInterval(() => {
        setItems((prev) =>
          prev.map((i) => {
            if (i.status === "uploading" && i.progress < 40) return { ...i, progress: i.progress + 5 }
            if (i.status === "analyzing" && i.progress < 80) return { ...i, progress: i.progress + 3 }
            return i
          })
        )
      }, 800)

      setTimeout(() => {
        setItems((prev) => prev.map((i) => (i.status === "uploading" ? { ...i, status: "analyzing", progress: 50 } : i)))
      }, 1500)

      const res = await fetch("/api/ai/bulk-upload", { method: "POST", body: fd })
      clearInterval(progressInterval)
      const data = await res.json()

      if (res.ok) {
        data.results.forEach((result: any, index: number) => {
          const item = failedItems[index]
          if (item) {
            updateItem(item.id, {
              status: result.success ? "done" : "error",
              progress: 100,
              result,
            })
          }
        })

        const newSuccess = data.summary.success
        if (newSuccess > 0) {
          toast.success(`Retried: ${newSuccess} product${newSuccess !== 1 ? "s" : ""} created!`, { duration: 3000 })
        }
      }
    } catch (e: any) {
      toast.error("Retry failed", { description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl))
    setItems([])
    setHasStarted(false)
  }

  const successCount = items.filter((i) => i.status === "done").length
  const errorCount = items.filter((i) => i.status === "error").length
  const pendingCount = items.filter((i) => i.status === "pending").length
  const overallProgress = items.length > 0
    ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length)
    : 0

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">Bulk Upload + AI</h2>
              <p className="text-xs text-white/80">Upload 10+ images — AI auto-creates products</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (successCount > 0) onDone()
              onClose()
            }}
            className="p-2 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Settings + file picker (only if not started) */}
          {!hasStarted && (
            <div className="space-y-5">
              {/* Settings */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase tracking-wide">
                    Default Category (fallback)
                  </label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Let AI decide</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} ({c.productCount} items)</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                    Used when AI can&apos;t determine the category
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 uppercase tracking-wide">
                    Default Price (fallback)
                  </label>
                  <input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    placeholder="e.g. 99"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                    Used when AI can&apos;t suggest a price
                  </p>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[var(--accent)]", "bg-[var(--cream)]") }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-[var(--accent)]", "bg-[var(--cream)]") }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-[var(--accent)]", "bg-[var(--cream)]")
                  handleFileSelect(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-10 text-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--cream)]/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="w-16 h-16 rounded-full bg-[var(--cream)] flex items-center justify-center mx-auto mb-4">
                  <Upload size={28} className="text-[var(--primary)]" />
                </div>
                <p className="font-serif text-lg font-semibold text-[var(--foreground)] mb-1">
                  Drop Rakhi images here
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  or click to browse — JPEG, PNG, WebP (max 30 images)
                </p>
              </div>
            </div>
          )}

          {/* Selected items grid */}
          {items.length > 0 && (
            <div className="space-y-4">
              {/* Overall progress */}
              {hasStarted && (
                <div className="bg-[var(--cream)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Overall Progress
                    </span>
                    <span className="text-sm text-[var(--primary)] font-bold">{overallProgress}%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-green-600 font-semibold">✓ {successCount} done</span>
                    {errorCount > 0 && <span className="text-red-600 font-semibold">✗ {errorCount} failed</span>}
                    {pendingCount > 0 && <span className="text-[var(--muted-foreground)]">⏳ {pendingCount} pending</span>}
                  </div>
                </div>
              )}

              {/* Items grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-lg border border-[var(--border)] overflow-hidden group"
                  >
                    {/* Image preview */}
                    <div className="aspect-square relative overflow-hidden bg-[var(--cream)]">
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />

                      {/* Status overlay */}
                      {item.status !== "pending" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          {item.status === "uploading" && (
                            <div className="text-white text-center">
                              <Upload size={20} className="mx-auto mb-1" />
                              <span className="text-[10px] font-semibold">Uploading</span>
                            </div>
                          )}
                          {item.status === "analyzing" && (
                            <div className="text-white text-center">
                              <Sparkles size={20} className="mx-auto mb-1 animate-pulse" />
                              <span className="text-[10px] font-semibold">AI Analyzing</span>
                            </div>
                          )}
                          {item.status === "creating" && (
                            <div className="text-white text-center">
                              <Package size={20} className="mx-auto mb-1" />
                              <span className="text-[10px] font-semibold">Creating</span>
                            </div>
                          )}
                          {item.status === "done" && (
                            <div className="text-white text-center bg-green-600/80 w-full h-full flex flex-col items-center justify-center">
                              <Check size={28} className="mb-1" />
                              <span className="text-[10px] font-bold">Created</span>
                            </div>
                          )}
                          {item.status === "error" && (
                            <div className="text-white text-center bg-red-600/80 w-full h-full flex flex-col items-center justify-center p-1">
                              <AlertCircle size={24} className="mb-1" />
                              <span className="text-[9px] font-bold">Failed</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress bar at bottom */}
                      {isProcessing && item.status !== "done" && item.status !== "error" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div
                            className="h-full bg-[var(--accent)] transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Remove button (only if pending and not started) */}
                      {!hasStarted && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                          aria-label="Remove"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Info below image */}
                    <div className="p-2">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate" title={item.file.name}>
                        {item.result?.productName || item.file.name}
                      </p>
                      {item.result?.success && (
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs font-bold text-[var(--primary)]">
                            ₹{item.result.price}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)] truncate ml-1">
                            {item.result.category}
                          </span>
                        </div>
                      )}
                      {item.result && !item.result.success && item.result.error && (
                        <p className="text-[10px] text-red-600 mt-0.5 line-clamp-2" title={item.result.error}>
                          {item.result.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no items and not started */}
          {items.length === 0 && !hasStarted && (
            <div className="text-center py-6 text-sm text-[var(--muted-foreground)]">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
              Select 1-30 Rakhi images to get started
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--background)] flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--muted-foreground)]">
            {items.length > 0 && (
              <span>{items.length} image{items.length !== 1 ? "s" : ""} selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Retry failed button */}
            {hasStarted && errorCount > 0 && !isProcessing && (
              <button
                onClick={retryFailed}
                className="px-4 py-2 text-sm font-semibold text-[var(--primary)] border border-[var(--accent)] rounded-md hover:bg-[var(--cream)] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Retry {errorCount} failed
              </button>
            )}

            {/* Clear all */}
            {!isProcessing && items.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Clear all
              </button>
            )}

            {/* Process button */}
            {!hasStarted && items.length > 0 && (
              <button
                onClick={processAll}
                disabled={isProcessing || items.length === 0}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-md hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={14} /> Process {items.length} image{items.length !== 1 ? "s" : ""} with AI
              </button>
            )}

            {/* Done button */}
            {hasStarted && !isProcessing && successCount > 0 && (
              <button
                onClick={() => { onDone(); onClose() }}
                className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check size={14} /> Done — View {successCount} new product{successCount !== 1 ? "s" : ""}
                <ChevronRight size={14} />
              </button>
            )}

            {/* Close (during processing) */}
            {isProcessing && (
              <button
                disabled
                className="px-5 py-2 bg-[var(--muted-foreground)] text-white text-sm font-semibold rounded-md flex items-center gap-2 opacity-70 cursor-not-allowed"
              >
                <Loader2 size={14} className="animate-spin" /> Processing...
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
