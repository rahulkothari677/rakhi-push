import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: "Image URL required" }, { status: 400 })

    let fullImageUrl = imageUrl
    if (imageUrl.startsWith("/")) {
      const baseURL = req.headers.get("host") ? `https://${req.headers.get("host")}` : "http://localhost:3000"
      fullImageUrl = `${baseURL}${imageUrl}`
    }

    const prompt = `You are an expert Rakhi product catalog manager for "House of Neelam" — a premium Rakhi e-commerce store.

Analyze this Rakhi product image and provide ALL the following details:

1. name: A premium, elegant product name (2-6 words, capitalize each word)
2. category: Choose the BEST match from these exact options:
   - "Traditional Rakhi", "Designer Rakhi", "Kids Rakhi", "Bhaiya-Bhabhi (Lumba)",
   - "Premium Gold Rakhi", "Silver Rakhi", "Handmade Rakhi", "Personalized Rakhi",
   - "Roli-Chawal & Thali"
3. shortDescription: One-line description (max 80 characters, compelling)
4. description: Full 2-3 sentence description
5. materials: Array of materials used
6. features: Array of 3-4 key features
7. suggestedPrice: Suggested price in INR (integer)
8. badge: Choose one — "New", "Bestseller", "Premium", "Luxury", "Handmade", or null

Return ONLY valid JSON. Format:
{"name":"...","category":"...","shortDescription":"...","description":"...","materials":["..."],"features":["..."],"suggestedPrice":599,"badge":"Premium"}`

    let analysis = null
    let providerUsed = ""
    const allErrors: string[] = []

    const geminiKey = process.env.GEMINI_API_KEY
    const grokKey = process.env.XAI_API_KEY

    // ─── Try Google Gemini ───────────────────────────────────────────────
    if (geminiKey) {
      try {
        console.log("[AI] Trying Gemini...")
        const result = await analyzeWithGemini(fullImageUrl, prompt, geminiKey)
        if (result) {
          analysis = result
          providerUsed = "Google Gemini"
        }
      } catch (e: any) {
        allErrors.push(`Gemini: ${e.message}`)
        console.error("[AI] Gemini failed:", e.message)
      }
    }

    // ─── Try xAI Grok ────────────────────────────────────────────────────
    if (!analysis && grokKey) {
      try {
        console.log("[AI] Trying Grok...")
        const result = await analyzeWithGrok(fullImageUrl, prompt, grokKey)
        if (result) {
          analysis = result
          providerUsed = "xAI Grok"
        }
      } catch (e: any) {
        allErrors.push(`Grok: ${e.message}`)
        console.error("[AI] Grok failed:", e.message)
      }
    }

    // ─── Try built-in AI ────────────────────────────────────────────────
    if (!analysis) {
      try {
        console.log("[AI] Trying built-in...")
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()
        const response = await zai.chat.completions.createVision({
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: fullImageUrl } },
          ]}],
          thinking: { type: "disabled" },
        })
        let content = response.choices[0]?.message?.content || ""
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        try { analysis = JSON.parse(content) } catch {
          const m = content.match(/\{[\s\S]*\}/)
          if (m) analysis = JSON.parse(m[0])
        }
        if (analysis) providerUsed = "Built-in AI"
      } catch (e: any) {
        allErrors.push(`Built-in: ${e.message}`)
      }
    }

    if (!analysis) {
      // Check for specific errors and give helpful messages
      const errorStr = allErrors.join(" | ")
      let helpfulError = errorStr

      if (errorStr.includes("429") && errorStr.includes("quota")) {
        helpfulError = "Gemini API rate limit exceeded (free tier). Your key WORKS! But you've used up the free quota for this minute. Try again in 1-2 minutes, or enable billing on your Google Cloud project for higher limits. Go to: https://console.cloud.google.com/billing"
      } else if (errorStr.includes("API_KEY_SERVICE_BLOCKED") || errorStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
        helpfulError = "Gemini API key is not properly configured. Go to https://aistudio.google.com/app/apikey and create a NEW key. Make sure the Generative Language API is enabled."
      }

      return NextResponse.json({ error: helpfulError, debug: errorStr.slice(0, 500) }, { status: 500 })
    }

    return NextResponse.json({ analysis, provider: providerUsed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── Gemini: Try REST API with multiple auth methods ─────────────────────────
async function analyzeWithGemini(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  // Fetch image
  const imageRes = await fetch(imageUrl, { redirect: "follow" })
  if (!imageRes.ok) throw new Error(`Image fetch: ${imageRes.status}`)
  const base64 = Buffer.from(await imageRes.arrayBuffer()).toString("base64")
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

  // Try different models and auth methods
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"]
  const errors: string[] = []

  for (const model of models) {
    // Method 1: key as query param (v1beta)
    for (const version of ["v1beta", "v1"]) {
      for (const authMethod of ["query", "header"] as const) {
        try {
          const url = authMethod === "query"
            ? `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`
            : `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`

          const headers: Record<string, string> = { "Content-Type": "application/json" }
          if (authMethod === "header") headers["x-goog-api-key"] = apiKey

          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              contents: [{ parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ]}],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
            }),
          })

          if (res.ok) {
            const data = await res.json()
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
            if (content) {
              const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
              try { return JSON.parse(cleaned) } catch {}
              const m = cleaned.match(/\{[\s\S]*\}/)
              if (m) return JSON.parse(m[0])
            }
          } else {
            const errText = await res.text()
            try {
              const errJson = JSON.parse(errText)
              const msg = errJson.error?.message || errText.slice(0, 80)
              errors.push(`${model}/${version}/${authMethod}: ${res.status} ${msg.slice(0, 60)}`)
            } catch {
              errors.push(`${model}/${version}/${authMethod}: ${res.status}`)
            }
          }
        } catch (e: any) {
          errors.push(`${model}/${version}/${authMethod}: ${e.message?.slice(0, 60)}`)
        }
      }
    }
  }

  throw new Error(errors.join("; "))
}

// ─── Grok: List models first, then try each ──────────────────────────────────
async function analyzeWithGrok(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  // First, list available models
  let availableModels: string[] = []
  try {
    const listRes = await fetch("https://api.x.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (listRes.ok) {
      const listData = await listRes.json()
      availableModels = (listData.data || []).map((m: any) => m.id)
      console.log("[AI] Grok available models:", availableModels)
    }
  } catch {}

  // Try all models that support vision, plus fallback names
  const visionModels = availableModels.filter(m =>
    m.includes("vision") || m.includes("vl")
  )
  const fallbackModels = ["grok-2-vision-1212", "grok-vision-beta", "grok-2-vision"]
  const modelsToTry = [...visionModels, ...fallbackModels].filter((v, i, a) => a.indexOf(v) === i)

  const errors: string[] = []

  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ]}],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ""
        if (content) {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
          try { return JSON.parse(cleaned) } catch {}
          const m = cleaned.match(/\{[\s\S]*\}/)
          if (m) return JSON.parse(m[0])
        }
      } else {
        const errText = await res.text()
        errors.push(`${model}: ${res.status} ${errText.slice(0, 60)}`)
      }
    } catch (e: any) {
      errors.push(`${model}: ${e.message?.slice(0, 60)}`)
    }
  }

  throw new Error(errors.join("; "))
}
