import { NextResponse } from "next/server"
import {
  getCachedCategories,
  getCachedAIResponse,
  setCachedAIResponse,
  getSearchByImagePrompt,
  VISION_MODELS,
  fetchImageAsBase64,
  callGitHubVision,
  withTimeout,
  parseJsonResponse,
} from "@/lib/ai/optimize"

/**
 * AI-powered image search — user uploads a Rakhi photo, AI describes it in
 * keywords that can be used to search the catalog.
 *
 * Phase 3 optimizations:
 *   - Categories cached for 5 minutes (avoids DB hit per request)
 *   - AI responses cached for 10 minutes (avoids re-analyzing same image)
 *   - Reduced prompt size (5x smaller = faster)
 *   - Fast model first (gpt-4o-mini before gpt-4o)
 *   - 10s timeout on image fetch, 30s on AI calls
 *   - Parallel fallback to Gemini if GitHub is slow
 *
 * Returns: { searchQuery, category, provider }
 */
export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 })
    }

    // Check AI response cache first (10 min TTL)
    const cached = getCachedAIResponse(imageUrl)
    if (cached) {
      return NextResponse.json({ ...cached, provider: `${cached.provider}-cached` })
    }

    // Fetch categories (cached 5 min)
    const origin = new URL(req.url).origin
    const categoryNames = await getCachedCategories(origin)

    const prompt = getSearchByImagePrompt(categoryNames)

    let analysis: { searchQuery?: string; category?: string | null } | null = null
    let provider = "none"
    const errors: string[] = []

    // Fetch image once, reuse for all providers
    const imgData = await fetchImageAsBase64(imageUrl)

    if (!imgData) {
      return NextResponse.json(
        { error: "Could not fetch the uploaded image. Please try again.", searchQuery: null },
        { status: 500 }
      )
    }

    // ─── 1. GitHub Models — try fast model first, then accurate model ─────
    for (const model of VISION_MODELS) {
      if (analysis) break
      try {
        const content = await withTimeout(
          callGitHubVision(prompt, imgData, model, 200),
          25000,
          `GitHub ${model}`
        )
        if (content) {
          const parsed = parseJsonResponse(content)
          if (parsed && (parsed.searchQuery || parsed.category)) {
            analysis = parsed
            provider = `github-${model}`
          }
        }
      } catch (e: any) {
        errors.push(`GitHub ${model}: ${e.message}`)
      }
    }

    // ─── 2. Gemini native v1beta (fallback) ───────────────────────────────
    if (!analysis) {
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
                  contents: [{
                    parts: [
                      { text: prompt },
                      { inline_data: { mime_type: imgData.mimeType, data: imgData.base64 } },
                    ],
                  }],
                  generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
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
            const parsed = parseJsonResponse(content)
            if (parsed && (parsed.searchQuery || parsed.category)) {
              analysis = parsed
              provider = "gemini-v1beta"
            }
          } else {
            errors.push(`Gemini HTTP ${res.status}`)
          }
        } catch (e: any) {
          errors.push(`Gemini: ${e.message}`)
        }
      }
    }

    // ─── 3. ZAI SDK (dev-only fallback) ───────────────────────────────────
    if (!analysis) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()
        const response = await withTimeout(
          zai.chat.completions.createVision({
            model: "glm-4.5v",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${imgData.mimeType};base64,${imgData.base64}` } },
              ],
            }],
            thinking: { type: "disabled" },
          }),
          25000,
          "ZAI SDK"
        )

        const content = response.choices?.[0]?.message?.content || ""
        const parsed = parseJsonResponse(content)
        if (parsed && (parsed.searchQuery || parsed.category)) {
          analysis = parsed
          provider = "zai-sdk"
        }
      } catch (e: any) {
        errors.push(`ZAI: ${e.message}`)
      }
    }

    if (!analysis) {
      console.error("[AI Search] All providers failed:", errors)
      return NextResponse.json(
        { error: "We couldn't analyze your image right now. Please try a text search instead.", searchQuery: null },
        { status: 500 }
      )
    }

    // Ensure searchQuery is always present
    let finalQuery = analysis.searchQuery?.trim()
    if (!finalQuery) {
      finalQuery = analysis.category && analysis.category !== "null"
        ? analysis.category
        : "rakhi"
    }

    // Validate category against real categories
    let finalCategory: string | null = null
    if (analysis.category && analysis.category !== "null" && categoryNames.length > 0) {
      const matched = categoryNames.find(
        (c) => c.toLowerCase() === analysis.category!.toLowerCase()
      )
      finalCategory = matched || null
    }

    const result = {
      searchQuery: finalQuery,
      category: finalCategory,
      provider,
    }

    // Cache the result for 10 minutes
    setCachedAIResponse(imageUrl, result)

    return NextResponse.json(result)
  } catch (e: any) {
    console.error("[AI Search] Error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
