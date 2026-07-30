import { NextResponse } from "next/server"
import {
  getCachedCategories,
  getShoppingAssistantSystemPrompt,
  TEXT_MODELS,
  callGitHubText,
  withTimeout,
  parseJsonResponse,
} from "@/lib/ai/optimize"

/**
 * AI Shopping Assistant for "House of Neelam" Rakhi store.
 *
 * Phase 3 optimizations:
 *   - Categories cached (5 min TTL)
 *   - Products cached via Next.js fetch cache (5 min revalidate)
 *   - Reduced prompt size (3x smaller)
 *   - Fast model only (gpt-4o-mini) for text tasks
 *   - 25s timeout on AI calls
 *   - Robust JSON parsing
 */
export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const origin = new URL(req.url).origin

    // Fetch categories (cached) + products (cached via Next.js)
    const [categoryNames, prodsRes] = await Promise.all([
      getCachedCategories(origin),
      fetch(`${origin}/api/products?limit=30`, {
        next: { revalidate: 300 }, // 5 min cache
      }),
    ])

    const prodsData = await prodsRes.json()
    // Include slug so the frontend can navigate to product pages when user clicks a recommendation
    const products = (prodsData.products || []).slice(0, 20).map((p: any) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      slug: p.slug,
    }))
    const productLines = products.map((p) =>
      `- ${p.name} | ${p.category} | ₹${p.price} | slug:${p.slug}`
    )

    const systemPrompt = `You are "Neelam", AI shopping assistant for House of Neelam Rakhi store.

Categories: ${categoryNames.join(", ")}

Products (name | category | price | slug):
${productLines.join("\n")}

Reply warmly and briefly (2-4 sentences). Recommend specific products by name+price.

Return ONLY JSON:
{"reply":"text","filter":{"category":"exact name or null","searchQuery":"keywords or null","maxPrice":number or null},"products":[{"name":"exact product name","slug":"exact slug from catalog"}],"suggestions":["short follow-up question 1","short follow-up question 2"]}

The "products" array should contain 1-3 products you recommend (use EXACT name and slug from the catalog above). If no specific products apply, return empty array.
The "filter" helps navigate to product listing. Set to null if not applicable.
The "suggestions" should be 2-3 short follow-up questions (max 40 chars).`

    // Build conversation messages
    const conversationHistory = Array.isArray(history)
      ? history.slice(-6).map((m: any) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
          content: String(m.content || ""),
        }))
      : []

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ]

    let parsed: any = null
    let provider = "none"
    const errors: string[] = []

    // ─── 1. GitHub Models (fast — gpt-4o-mini) ────────────────────────────
    for (const model of TEXT_MODELS) {
      if (parsed) break
      try {
        const content = await withTimeout(
          callGitHubText(messages, model, 500),
          25000,
          `GitHub ${model}`
        )
        if (content) {
          parsed = parseJsonResponse(content)
          if (parsed && parsed.reply) {
            provider = `github-${model}`
          } else {
            parsed = null
          }
        }
      } catch (e: any) {
        errors.push(`GitHub ${model}: ${e.message}`)
      }
    }

    // ─── 2. Gemini native v1beta (fallback) ───────────────────────────────
    if (!parsed) {
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey) {
        try {
          const res = await withTimeout(
            fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: messages
                    .filter((m) => m.role !== "system")
                    .map((m) => ({
                      role: m.role === "assistant" ? "model" : "user",
                      parts: [{ text: m.content }],
                    })),
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: { maxOutputTokens: 500, temperature: 0.5 },
                }),
              }
            ),
            25000,
            "Gemini v1beta"
          )

          if (res.ok) {
            const data = await res.json()
            const parts = data?.candidates?.[0]?.content?.parts || []
            const textPart = parts.find((p: any) => typeof p.text === "string")
            const content = textPart?.text || ""
            parsed = parseJsonResponse(content)
            if (parsed && parsed.reply) {
              provider = "gemini-v1beta"
            } else {
              parsed = null
            }
          } else {
            errors.push(`Gemini HTTP ${res.status}`)
          }
        } catch (e: any) {
          errors.push(`Gemini: ${e.message}`)
        }
      }
    }

    // ─── 3. ZAI SDK (dev fallback) ──────────────────────────────────────
    if (!parsed) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()
        const response = await withTimeout(
          zai.chat.completions.create({
            model: "glm-4.5-air",
            messages,
            thinking: { type: "disabled" },
          }),
          25000,
          "ZAI SDK"
        )
        const content = response.choices?.[0]?.message?.content || ""
        parsed = parseJsonResponse(content)
        if (parsed && parsed.reply) {
          provider = "zai-sdk"
        } else {
          parsed = null
        }
      } catch (e: any) {
        errors.push(`ZAI: ${e.message}`)
      }
    }

    if (!parsed) {
      console.error("[Shopping Assistant] All providers failed:", errors)
      return NextResponse.json(
        {
          reply: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or use the search bar to find Rakhis by name or category.",
          filter: null,
          suggestions: ["Show me all Rakhis", "What categories do you have?"],
        },
        { status: 200 }
      )
    }

    // Validate and sanitize response
    const reply = typeof parsed.reply === "string"
      ? parsed.reply
      : "I'm not sure how to help with that. Could you rephrase?"

    const filter = parsed.filter && typeof parsed.filter === "object"
      ? {
          category: typeof parsed.filter.category === "string" && parsed.filter.category !== "null"
            ? parsed.filter.category
            : null,
          searchQuery: typeof parsed.filter.searchQuery === "string" && parsed.filter.searchQuery !== "null"
            ? parsed.filter.searchQuery
            : null,
          maxPrice: typeof parsed.filter.maxPrice === "number" && parsed.filter.maxPrice > 0
            ? parsed.filter.maxPrice
            : null,
        }
      : null

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: any) => typeof s === "string").slice(0, 3)
      : []

    // Validate products array — each must have a name and slug
    const recommendedProducts = Array.isArray(parsed.products)
      ? parsed.products
          .filter((p: any) => p && typeof p === "object" && typeof p.name === "string" && typeof p.slug === "string")
          .slice(0, 3)
          // Verify the slug exists in our catalog
          .filter((p: any) => products.some((cat: any) => cat.slug === p.slug))
          .map((p: any) => {
            const cat = products.find((c: any) => c.slug === p.slug)
            return { name: cat.name, slug: p.slug, price: cat.price, category: cat.category }
          })
      : []

    return NextResponse.json({ reply, filter, products: recommendedProducts, suggestions, provider })
  } catch (e: any) {
    console.error("[Shopping Assistant] Error:", e)
    return NextResponse.json(
      {
        reply: "Something went wrong on my end. Please try again or use the search bar.",
        filter: null,
        suggestions: [],
      },
      { status: 500 }
    )
  }
}
