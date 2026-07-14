import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"

// AI-powered image analysis — supports multiple AI providers
// Priority: 1. Google Gemini, 2. xAI Grok, 3. z-ai-web-dev-sdk (default)

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 })
    }

    // If image URL is a relative path (like /uploads/...), convert to full URL
    let fullImageUrl = imageUrl
    if (imageUrl.startsWith("/")) {
      const baseURL = req.headers.get("host")
        ? `https://${req.headers.get("host")}`
        : "http://localhost:3000"
      fullImageUrl = `${baseURL}${imageUrl}`
    }

    console.log("[AI] Analyzing image:", fullImageUrl.slice(0, 80))

    const prompt = `You are an expert Rakhi product catalog manager for "House of Neelam" — a premium Rakhi e-commerce store.

Analyze this Rakhi product image and provide ALL the following details:

1. name: A premium, elegant product name (2-6 words, capitalize each word)
2. category: Choose the BEST match from these exact options:
   - "Traditional Rakhi"
   - "Designer Rakhi"
   - "Kids Rakhi"
   - "Bhaiya-Bhabhi (Lumba)"
   - "Premium Gold Rakhi"
   - "Silver Rakhi"
   - "Handmade Rakhi"
   - "Personalized Rakhi"
   - "Roli-Chawal & Thali"
3. shortDescription: One-line description (max 80 characters, compelling)
4. description: Full 2-3 sentence description with details about design, materials, and significance
5. materials: Array of materials used (e.g., ["Pearl", "Silk thread", "Gold-tone metal"])
6. features: Array of 3-4 key features (e.g., ["Handcrafted", "Premium quality", "Comes in gift box"])
7. suggestedPrice: Suggested price in INR (integer, based on materials and design quality)
8. badge: Choose one — "New", "Bestseller", "Premium", "Luxury", "Handmade", or null if none apply

Return ONLY valid JSON (no markdown, no code blocks). Format:
{"name":"...","category":"...","shortDescription":"...","description":"...","materials":["..."],"features":["..."],"suggestedPrice":599,"badge":"Premium"}`

    let analysis = null
    let providerUsed = ""
    let lastError = ""

    const geminiKey = process.env.GEMINI_API_KEY
    const grokKey = process.env.XAI_API_KEY

    console.log("[AI] Providers:", {
      gemini: geminiKey ? `key starts with ${geminiKey.slice(0, 8)}...` : "not set",
      grok: grokKey ? "set" : "not set",
    })

    // ─── Try Google Gemini ───────────────────────────────────────────────
    if (!analysis && geminiKey) {
      try {
        console.log("[AI] Trying Google Gemini...")
        analysis = await analyzeWithGemini(fullImageUrl, prompt, geminiKey)
        providerUsed = "Google Gemini"
        console.log("[AI] Gemini success!")
      } catch (e: any) {
        lastError = `Gemini: ${e.message}`
        console.error("[AI] Gemini failed:", e.message)
      }
    }

    // ─── Try xAI Grok ────────────────────────────────────────────────────
    if (!analysis && grokKey) {
      try {
        console.log("[AI] Trying xAI Grok...")
        analysis = await analyzeWithGrok(fullImageUrl, prompt, grokKey)
        providerUsed = "xAI Grok"
        console.log("[AI] Grok success!")
      } catch (e: any) {
        lastError = `${lastError} | Grok: ${e.message}`
        console.error("[AI] Grok failed:", e.message)
      }
    }

    // ─── Try z-ai-web-dev-sdk as fallback ────────────────────────────────
    if (!analysis) {
      try {
        console.log("[AI] Trying built-in AI...")
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()

        const response = await zai.chat.completions.createVision({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: fullImageUrl } },
              ],
            },
          ],
          thinking: { type: "disabled" },
        })

        let content = response.choices[0]?.message?.content || ""
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

        try {
          analysis = JSON.parse(content)
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) analysis = JSON.parse(jsonMatch[0])
        }

        if (analysis) {
          providerUsed = "Built-in AI"
          console.log("[AI] Built-in AI success!")
        }
      } catch (e: any) {
        lastError = `${lastError} | Built-in: ${e.message}`
        console.error("[AI] Built-in failed:", e.message)
      }
    }

    if (!analysis) {
      return NextResponse.json(
        { error: `All AI providers failed. Errors: ${lastError}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ analysis, provider: providerUsed })
  } catch (e: any) {
    console.error("[AI] Fatal error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── Google Gemini ───────────────────────────────────────────────────────────
// Works with BOTH old format (AIza...) and new format (AQ.Ab8...) keys
async function analyzeWithGemini(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  // Fetch image and convert to base64
  const imageRes = await fetch(imageUrl, { redirect: "follow" })
  if (!imageRes.ok) {
    throw new Error(`Image fetch failed: ${imageRes.status}`)
  }
  const imageBuffer = await imageRes.arrayBuffer()
  const base64 = Buffer.from(imageBuffer).toString("base64")
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

  // Try multiple Gemini models (some might not be available in all regions)
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
  let lastErr = ""

  for (const model of models) {
    try {
      // Pass API key BOTH as header AND query param for max compatibility
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        let errMsg = `${res.status}`
        try {
          const errJson = JSON.parse(errText)
          errMsg = `${res.status}: ${errJson.error?.message || errText.slice(0, 100)}`
        } catch {
          errMsg = `${res.status}: ${errText.slice(0, 100)}`
        }
        lastErr = `${model} → ${errMsg}`
        console.error(`[AI] Gemini ${model} failed:`, errMsg)
        continue // Try next model
      }

      const data = await res.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      if (!content) {
        lastErr = `${model} → empty response`
        continue
      }

      // Parse JSON from response
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try {
        return JSON.parse(cleaned)
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) return JSON.parse(jsonMatch[0])
        lastErr = `${model} → invalid JSON`
      }
    } catch (e: any) {
      lastErr = `${model} → ${e.message}`
    }
  }

  throw new Error(lastErr || "All Gemini models failed")
}

// ─── xAI Grok ────────────────────────────────────────────────────────────────
async function analyzeWithGrok(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  // Grok vision model — try both available model names
  const models = ["grok-2-vision-1212", "grok-vision-beta"]
  let lastErr = ""

  for (const model of models) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        lastErr = `${model} → ${res.status}: ${errText.slice(0, 100)}`
        console.error(`[AI] Grok ${model} failed:`, lastErr)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content || ""

      if (!content) {
        lastErr = `${model} → empty response`
        continue
      }

      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try {
        return JSON.parse(cleaned)
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) return JSON.parse(jsonMatch[0])
        lastErr = `${model} → invalid JSON`
      }
    } catch (e: any) {
      lastErr = `${model} → ${e.message}`
    }
  }

  throw new Error(lastErr || "All Grok models failed")
}
