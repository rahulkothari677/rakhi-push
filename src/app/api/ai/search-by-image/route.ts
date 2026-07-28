import { NextResponse } from "next/server"

/**
 * AI-powered image search — user uploads a Rakhi photo, AI describes it in
 * keywords that can be used to search the catalog.
 *
 * Provider order (most reliable first):
 *   1. ZAI built-in SDK (always available, no API key needed, vision-capable)
 *   2. Gemini native v1beta endpoint (works with new AQ.-format keys)
 *   3. Gemini OpenAI-compatible endpoint (legacy fallback)
 *
 * Returns: { searchQuery: string, category?: string | null, provider: string }
 *   - searchQuery is always returned (falls back to category, then to a default)
 *   - category may be null if AI can't determine it
 */
export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 })
    }

    const prompt = `You are helping a customer find Rakhis on the "House of Neelam" store.

Look at this image carefully and describe what you see in 3-5 search keywords that would help find similar products in our Rakhi catalog.

Focus on:
- Type (traditional, designer, kids, lumba, gold, silver, handmade, personalized)
- Color (red, gold, silver, pink, blue, etc.)
- Material (pearl, silk, thread, metal, beads, etc.)
- Style (floral, peacock, simple, ornate, cartoon, divine, etc.)
- Recipient (brother, bhabhi, kids, etc.) if obvious

Categories in our catalog: Traditional Rakhi, Designer Rakhi, Kids Rakhi, Bhaiya-Bhabhi (Lumba), Premium Gold Rakhi, Silver Rakhi, Handmade Rakhi, Personalized Rakhi, Roli-Chawal & Thali

Return ONLY a JSON object (no markdown, no code blocks, no extra text):
{"searchQuery": "keyword1 keyword2 keyword3", "category": "exact category name from list above or null"}`

    let analysis: { searchQuery?: string; category?: string | null } | null = null
    let provider = "none"

    // ─── 1. Gemini native v1beta (primary — works on Vercel with AQ. format keys) ─
    if (!analysis) {
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey) {
        try {
          const imageRes = await fetch(imageUrl, { redirect: "follow" })
          if (imageRes.ok) {
            const buffer = Buffer.from(await imageRes.arrayBuffer())
            const base64 = buffer.toString("base64")
            const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: prompt },
                      { inline_data: { mime_type: mimeType, data: base64 } },
                    ],
                  }],
                  generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
                }),
              }
            )

            if (res.ok) {
              const data = await res.json()
              const parts = data?.candidates?.[0]?.content?.parts || []
              const textPart = parts.find((p: any) => typeof p.text === "string")
              const content = textPart?.text || ""
              analysis = parseAnalysisResponse(content)
              if (analysis) provider = "gemini-v1beta"
            } else {
              const errText = await res.text()
              console.error(`[AI Search] Gemini v1beta HTTP ${res.status}:`, errText.slice(0, 200))
            }
          }
        } catch (e: any) {
          console.error("[AI Search] Gemini v1beta failed:", e.message)
        }
      }
    }

    // ─── 2. ZAI SDK (fallback — only works when .z-ai-config is present, i.e. dev) ─
    if (!analysis) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()

        // Fetch image and convert to base64 for reliable transmission
        const imageRes = await fetch(imageUrl, { redirect: "follow" })
        if (imageRes.ok) {
          const buffer = Buffer.from(await imageRes.arrayBuffer())
          const base64 = buffer.toString("base64")
          const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

          const response = await zai.chat.completions.createVision({
            model: "glm-4.5v",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
              ],
            }],
            thinking: { type: "disabled" },
          })

          const content = response.choices?.[0]?.message?.content || ""
          analysis = parseAnalysisResponse(content)
          if (analysis) provider = "zai-sdk"
        }
      } catch (e: any) {
        console.error("[AI Search] ZAI SDK failed:", e.message)
      }
    }

    // ─── 3. Gemini OpenAI-compatible endpoint (legacy fallback) ───────────
    if (!analysis) {
      const geminiKey = process.env.GEMINI_API_KEY
      if (geminiKey) {
        try {
          const imageRes = await fetch(imageUrl, { redirect: "follow" })
          if (imageRes.ok) {
            const buffer = Buffer.from(await imageRes.arrayBuffer())
            const base64 = buffer.toString("base64")
            const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${geminiKey}`,
              },
              body: JSON.stringify({
                model: "gemini-2.0-flash",
                messages: [{
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
                  ],
                }],
                max_tokens: 300,
              }),
            })

            if (res.ok) {
              const data = await res.json()
              const content = data.choices?.[0]?.message?.content || ""
              analysis = parseAnalysisResponse(content)
              if (analysis) provider = "gemini-openai"
            }
          }
        } catch (e: any) {
          console.error("[AI Search] Gemini OpenAI endpoint failed:", e.message)
        }
      }
    }

    // ─── Final fallback — return a generic search query so user sees results ─
    if (!analysis) {
      console.error("[AI Search] All providers failed.")
      return NextResponse.json(
        {
          error: "We couldn't analyze your image right now. Please try a text search instead.",
          searchQuery: null,
        },
        { status: 500 }
      )
    }

    // Ensure searchQuery is always present — fall back to category, then default
    let finalQuery = analysis.searchQuery?.trim()
    if (!finalQuery) {
      finalQuery = analysis.category && analysis.category !== "null"
        ? analysis.category
        : "rakhi"
    }

    return NextResponse.json({
      searchQuery: finalQuery,
      category: analysis.category && analysis.category !== "null" ? analysis.category : null,
      provider,
    })
  } catch (e: any) {
    console.error("[AI Search] Error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * Robust JSON extraction — handles markdown code fences, leading/trailing
 * text, partial JSON, and gracefully extracts `{...}` blocks.
 */
function parseAnalysisResponse(content: string): { searchQuery?: string; category?: string | null } | null {
  if (!content || typeof content !== "string") return null

  // Strip markdown code fences
  let cleaned = content.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === "object" && (parsed.searchQuery || parsed.category)) {
      return parsed
    }
  } catch {}

  // Try to find a {...} block
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed && typeof parsed === "object" && (parsed.searchQuery || parsed.category)) {
        return parsed
      }
    } catch {}
  }

  // Last resort — extract searchQuery and category using regex
  const sqMatch = cleaned.match(/"searchQuery"\s*:\s*"([^"]+)"/)
  const catMatch = cleaned.match(/"category"\s*:\s*"?([^",}]+)"?/)
  if (sqMatch || catMatch) {
    return {
      searchQuery: sqMatch?.[1] || undefined,
      category: catMatch?.[1] || null,
    }
  }

  return null
}
