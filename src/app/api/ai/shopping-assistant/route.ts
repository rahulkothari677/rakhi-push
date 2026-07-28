import { NextResponse } from "next/server"

/**
 * AI Shopping Assistant for "House of Neelam" Rakhi store.
 *
 * Users can ask questions like:
 *   - "I want a Rakhi for my 5-year-old brother"
 *   - "Show me premium gold Rakhis under ₹2000"
 *   - "What's the difference between Traditional and Designer Rakhi?"
 *   - "I need a Lumba for my bhabhi, something with pearls"
 *
 * The assistant returns:
 *   - A friendly, helpful reply (markdown-safe plain text)
 *   - Optional product filters (category, maxPrice, searchQuery) that the
 *     frontend can apply to navigate the user to the right products
 *   - Optional quick-reply suggestions for follow-up questions
 *
 * Provider chain (same as image search):
 *   1. GitHub Models (gpt-4o-mini) — primary, free, fast
 *   2. Gemini native v1beta — fallback
 *   3. ZAI SDK — dev-only fallback
 */
export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Fetch catalog context (categories + sample products) so the AI gives
    // relevant answers grounded in the actual store inventory
    const [catsRes, prodsRes] = await Promise.all([
      fetch(`${new URL(req.url).origin}/api/categories`),
      fetch(`${new URL(req.url).origin}/api/products?limit=50`),
    ])
    const catsData = await catsRes.json()
    const prodsData = await prodsRes.json()
    const categories = (catsData.categories || []).map((c: any) => ({
      name: c.name,
      count: c.productCount,
    }))
    const products = (prodsData.products || []).map((p: any) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      slug: p.slug,
    }))

    const systemPrompt = `You are "Neelam", the friendly AI shopping assistant for House of Neelam, a premium Rakhi store in India.

Your job: help customers find the perfect Rakhi, answer questions about our products, traditions, gifting, and ordering.

STORE CATALOG:
Categories (with item counts):
${categories.map((c: any) => `- ${c.name} (${c.count} items)`).join("\n")}

Sample products (use these as reference, but you can recommend any category):
${products.slice(0, 30).map((p: any) => `- ${p.name} | ${p.category} | ₹${p.price} | slug: ${p.slug}`).join("\n")}

GUIDELINES:
- Be warm, festive, and helpful — like a knowledgeable family friend
- Keep replies short (2-4 sentences for normal questions, max 6 for complex ones)
- When recommending products, mention specific names and prices
- If user mentions a budget, only recommend products within it
- If user mentions a recipient (brother, bhabhi, kids, etc.), suggest appropriate categories
- For Rakhi traditions/questions, give brief culturally accurate answers
- If user wants to buy/order, mention they can add to cart and checkout via WhatsApp
- DO NOT invent products or prices that aren't in the catalog above
- DO NOT mention competitors or external websites

RESPONSE FORMAT (IMPORTANT — return ONLY valid JSON, no markdown, no code fences):
{
  "reply": "your response text here (use \\n for line breaks)",
  "filter": {
    "category": "exact category name from the catalog or null",
    "searchQuery": "search keywords to filter products or null",
    "maxPrice": 2000  // number or null
  },
  "suggestions": ["short follow-up question 1", "short follow-up question 2"]
}

The "filter" object helps the UI navigate the user to relevant products. Set it to null if the user's question doesn't require product filtering (e.g., general questions about Rakhi traditions).
The "suggestions" array should have 2-3 short suggested follow-up questions (max 40 chars each).

Return ONLY the JSON object.`

    const conversationHistory = Array.isArray(history)
      ? history.slice(-8).map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content || "",
        }))
      : []

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: String(m.content || ""),
      })),
      { role: "user", content: message },
    ]

    let parsed: any = null
    let provider = "none"
    const errors: string[] = []

    // ─── 1. GitHub Models (primary) ─────────────────────────────────────
    if (!parsed) {
      const githubToken = process.env.GITHUB_TOKEN
      if (githubToken) {
        try {
          const res = await fetch("https://models.github.ai/inference/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${githubToken}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages,
              max_tokens: 600,
              temperature: 0.5,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            const content = data.choices?.[0]?.message?.content || ""
            parsed = parseJsonResponse(content)
            if (parsed) provider = "github-gpt-4o-mini"
          } else {
            errors.push(`GitHub HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`)
          }
        } catch (e: any) {
          errors.push(`GitHub exception: ${e.message}`)
        }
      } else {
        errors.push("GITHUB_TOKEN not configured")
      }
    }

    // ─── 2. Gemini native v1beta ─────────────────────────────────────────
    if (!parsed) {
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: messages.map((m) => ({
                  role: m.role === "assistant" ? "model" : "user",
                  parts: [{ text: m.content }],
                })),
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
              }),
            }
          )
          if (res.ok) {
            const data = await res.json()
            const parts = data?.candidates?.[0]?.content?.parts || []
            const textPart = parts.find((p: any) => typeof p.text === "string")
            const content = textPart?.text || ""
            parsed = parseJsonResponse(content)
            if (parsed) provider = "gemini-v1beta"
          } else {
            errors.push(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`)
          }
        } catch (e: any) {
          errors.push(`Gemini exception: ${e.message}`)
        }
      }
    }

    // ─── 3. ZAI SDK (dev fallback) ──────────────────────────────────────
    if (!parsed) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()
        const response = await zai.chat.completions.create({
          model: "glm-4.5-air",
          messages,
          thinking: { type: "disabled" },
        })
        const content = response.choices?.[0]?.message?.content || ""
        parsed = parseJsonResponse(content)
        if (parsed) provider = "zai-sdk"
      } catch (e: any) {
        errors.push(`ZAI exception: ${e.message}`)
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

    // Validate and sanitize the response shape
    const reply = typeof parsed.reply === "string" ? parsed.reply : "I'm not sure how to help with that. Could you rephrase?"
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

    return NextResponse.json({ reply, filter, suggestions, provider })
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

/**
 * Robust JSON extraction — handles markdown code fences, leading/trailing
 * text, partial JSON, and gracefully extracts `{...}` blocks.
 */
function parseJsonResponse(content: string): any | null {
  if (!content || typeof content !== "string") return null

  let cleaned = content.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === "object" && parsed.reply) return parsed
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed && typeof parsed === "object" && parsed.reply) return parsed
    } catch {}
  }

  // Last resort — extract fields with regex
  const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (replyMatch) {
    const reply = replyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
    const catMatch = cleaned.match(/"category"\s*:\s*"?([^",}]+)"?/)
    const sqMatch = cleaned.match(/"searchQuery"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    const mpMatch = cleaned.match(/"maxPrice"\s*:\s*(\d+)/)
    return {
      reply,
      filter: {
        category: catMatch?.[1] || null,
        searchQuery: sqMatch?.[1] || null,
        maxPrice: mpMatch ? parseInt(mpMatch[1]) : null,
      },
      suggestions: [],
    }
  }

  return null
}
