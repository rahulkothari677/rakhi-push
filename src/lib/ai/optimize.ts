/**
 * AI Optimization Utilities
 *
 * Phase 3 optimizations:
 *   1. In-memory cache for categories (avoids DB hit on every AI call)
 *   2. In-memory cache for AI responses (avoids re-analyzing same image)
 *   3. Reduced prompt sizes (smaller = faster + cheaper)
 *   4. Fast-model-first strategy (gpt-4o-mini for simple tasks, gpt-4o for vision)
 *   5. Parallel image fetching helper
 *   6. Timeout helper to fail fast on slow providers
 */

import crypto from "crypto"

// ─── Category Cache (5 minute TTL) ────────────────────────────────────────
type CategoryCacheEntry = { names: string[]; expiresAt: number }
let categoryCache: CategoryCacheEntry | null = null
const CATEGORY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCachedCategories(origin: string): Promise<string[]> {
  // Return cached if still valid
  if (categoryCache && Date.now() < categoryCache.expiresAt) {
    return categoryCache.names
  }

  try {
    const catsRes = await fetch(`${origin}/api/categories`, {
      // Use Next.js cache + short revalidate
      next: { revalidate: 300 },
    })
    const catsData = await catsRes.json()
    const names: string[] = (catsData.categories || []).map((c: any) => c.name)

    if (names.length > 0) {
      categoryCache = {
        names,
        expiresAt: Date.now() + CATEGORY_CACHE_TTL,
      }
      return names
    }
  } catch {
    // fall through to fallback
  }

  // Fallback list (matches current DB categories)
  return ["Girls Rakhi", "Kids Rakhi", "Trendy Rakhi", "Designer Rakhi", "Couple Rakhi", "Handmade Rakhi"]
}

/** Invalidate the category cache (call after admin creates/edits categories) */
export function invalidateCategoryCache() {
  categoryCache = null
}

// ─── AI Response Cache (10 minute TTL) ────────────────────────────────────
// Caches AI analysis by image URL hash so re-uploading the same image doesn't
// re-call the AI provider. Useful for retry scenarios.
const aiResponseCache = new Map<string, { result: any; expiresAt: number }>()
const AI_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export function getCachedAIResponse(imageUrl: string): any | null {
  const key = hashKey(imageUrl)
  const entry = aiResponseCache.get(key)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.result
  }
  if (entry) {
    aiResponseCache.delete(key) // expired
  }
  return null
}

export function setCachedAIResponse(imageUrl: string, result: any) {
  const key = hashKey(imageUrl)
  aiResponseCache.set(key, { result, expiresAt: Date.now() + AI_CACHE_TTL })

  // Prevent memory leak — limit cache to 100 entries
  if (aiResponseCache.size > 100) {
    const oldestKey = aiResponseCache.keys().next().value
    if (oldestKey) aiResponseCache.delete(oldestKey)
  }
}

function hashKey(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 16)
}

// ─── Reduced Prompts ───────────────────────────────────────────────────────
// Shorter prompts = faster responses + lower token costs

export function getSearchByImagePrompt(categoryNames: string[]): string {
  return `Identify this Rakhi in 3-5 search keywords + pick the best category.

Valid categories: ${categoryNames.join(", ")}

Return ONLY JSON: {"searchQuery":"kw1 kw2 kw3","category":"exact name or null"}`
}

export function getAnalyzeImagePrompt(categoryNames: string[]): string {
  return `Analyze this Rakhi product image. Return ONLY JSON:
{"name":"2-6 word name","category":"one of: ${categoryNames.join(", ")}","shortDescription":"max 80 chars","description":"2-3 sentences","materials":["..."],"features":["3-4 items"],"suggestedPrice":999,"badge":"New|Bestseller|Premium|Luxury|Handmade|null"}`
}

export function getShoppingAssistantSystemPrompt(categories: string[], products: string[]): string {
  return `You are "Neelam", AI shopping assistant for House of Neelam Rakhi store.

Categories: ${categories.join(", ")}

Sample products:
${products.join("\n")}

Reply warmly and briefly (2-4 sentences). Recommend specific products by name+price. Return ONLY JSON:
{"reply":"text","filter":{"category":"exact name or null","searchQuery":"keywords or null","maxPrice":number or null},"suggestions":["short q1","short q2"]}`
}

// ─── Model Selection (fast-first) ─────────────────────────────────────────
/**
 * For vision tasks, gpt-4o-mini is faster but less accurate than gpt-4o.
 * Use gpt-4o-mini as primary for speed, fall back to gpt-4o for accuracy.
 * For text-only tasks (shopping assistant), gpt-4o-mini is always best.
 */
export const VISION_MODELS = ["gpt-4o-mini", "gpt-4o"] // fast → accurate
export const TEXT_MODELS = ["gpt-4o-mini"] // fast only

// ─── Fetch Image as Base64 (with timeout) ──────────────────────────────────
export async function fetchImageAsBase64(
  url: string,
  timeoutMs = 10000
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const imageRes = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!imageRes.ok) return null

    const buffer = Buffer.from(await imageRes.arrayBuffer())
    return {
      base64: buffer.toString("base64"),
      mimeType: imageRes.headers.get("content-type") || "image/jpeg",
    }
  } catch {
    return null
  }
}

// ─── Timeout wrapper for AI calls ──────────────────────────────────────────
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = "Operation"
): Promise<T> {
  let timeout: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeout!)
  }
}

// ─── GitHub Models Vision Call ─────────────────────────────────────────────
export async function callGitHubVision(
  prompt: string,
  imageData: { base64: string; mimeType: string },
  model: string,
  maxTokens = 300
): Promise<string | null> {
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) return null

  try {
    const res = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${githubToken}`,
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` } },
          ],
        }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ""
  } catch {
    return null
  }
}

// ─── GitHub Models Text Call ───────────────────────────────────────────────
export async function callGitHubText(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  model: string,
  maxTokens = 600
): Promise<string | null> {
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) return null

  try {
    const res = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${githubToken}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.5,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ""
  } catch {
    return null
  }
}

// ─── Robust JSON Parser ────────────────────────────────────────────────────
export function parseJsonResponse(content: string): any | null {
  if (!content || typeof content !== "string") return null

  let cleaned = content.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()

  try {
    return JSON.parse(cleaned)
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }
  return null
}
