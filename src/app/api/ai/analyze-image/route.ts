import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
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

    const prompt = `You are an expert Rakhi product catalog manager for "House of Neelam".

Analyze this Rakhi product image and provide ALL details:

1. name: Premium elegant product name (2-6 words)
2. category: Choose from: "Traditional Rakhi", "Designer Rakhi", "Kids Rakhi", "Bhaiya-Bhabhi (Lumba)", "Premium Gold Rakhi", "Silver Rakhi", "Handmade Rakhi", "Personalized Rakhi", "Roli-Chawal & Thali"
3. shortDescription: One-line description (max 80 chars)
4. description: Full 2-3 sentence description
5. materials: Array of materials
6. features: Array of 3-4 features
7. suggestedPrice: Price in INR (integer)
8. badge: "New", "Bestseller", "Premium", "Luxury", "Handmade", or null

Return ONLY valid JSON:
{"name":"...","category":"...","shortDescription":"...","description":"...","materials":["..."],"features":["..."],"suggestedPrice":599,"badge":"Premium"}`

    let analysis = null
    let providerUsed = ""
    const allErrors: string[] = []

    const geminiKey = process.env.GEMINI_API_KEY
    const grokKey = process.env.XAI_API_KEY

    // ─── 1. Try Gemini via OpenAI-compatible endpoint ───────────────────
    if (!analysis && geminiKey) {
      try {
        console.log("[AI] Trying Gemini (OpenAI endpoint)...")
        const imageRes = await fetch(fullImageUrl, { redirect: "follow" })
        if (imageRes.ok) {
          const base64 = Buffer.from(await imageRes.arrayBuffer()).toString("base64")
          const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

          const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${geminiKey}`,
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
              max_tokens: 1000,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            const content = data.choices?.[0]?.message?.content || ""
            if (content) {
              const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
              try { analysis = JSON.parse(cleaned) } catch {
                const m = cleaned.match(/\{[\s\S]*\}/)
                if (m) analysis = JSON.parse(m[0])
              }
              if (analysis) providerUsed = "Google Gemini (OpenAI)"
            }
          } else {
            const errText = await res.text()
            let errMsg = `${res.status}`
            try { errMsg += `: ${JSON.parse(errText).error?.message?.slice(0, 100)}` } catch {}
            allErrors.push(`Gemini-OpenAI: ${errMsg}`)
          }
        }
      } catch (e: any) {
        allErrors.push(`Gemini-OpenAI: ${e.message}`)
      }
    }

    // ─── 2. Try Gemini via REST API ─────────────────────────────────────
    if (!analysis && geminiKey) {
      try {
        console.log("[AI] Trying Gemini (REST)...")
        analysis = await analyzeWithGeminiREST(fullImageUrl, prompt, geminiKey)
        if (analysis) providerUsed = "Google Gemini"
      } catch (e: any) {
        allErrors.push(`Gemini-REST: ${e.message}`)
      }
    }

    // ─── 3. Try Grok ────────────────────────────────────────────────────
    if (!analysis && grokKey) {
      try {
        console.log("[AI] Trying Grok...")
        analysis = await analyzeWithGrok(fullImageUrl, prompt, grokKey)
        if (analysis) providerUsed = "xAI Grok"
      } catch (e: any) {
        allErrors.push(`Grok: ${e.message}`)
      }
    }

    // ─── 4. Try built-in z-ai SDK ───────────────────────────────────────
    if (!analysis) {
      try {
        console.log("[AI] Trying built-in...")
        // Try writing config from env var or committed file
        const zaiConfig = process.env.Z_AI_CONFIG
        if (zaiConfig) {
          await fs.writeFile("/tmp/.z-ai-config", zaiConfig)
        }

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
      const errorStr = allErrors.join(" | ")
      let helpfulError = errorStr

      if (errorStr.includes("429") || errorStr.includes("quota")) {
        helpfulError = "Gemini free tier quota is 0. Your Google Cloud project needs billing enabled (you get $300 FREE credit — you will NOT be charged). Go to: https://console.cloud.google.com/billing — Select your project → Link billing account → Done. Then try again."
      }

      return NextResponse.json({ error: helpfulError, debug: errorStr.slice(0, 300) }, { status: 500 })
    }

    return NextResponse.json({ analysis, provider: providerUsed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function analyzeWithGeminiREST(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  const imageRes = await fetch(imageUrl, { redirect: "follow" })
  if (!imageRes.ok) throw new Error(`Image fetch: ${imageRes.status}`)
  const base64 = Buffer.from(await imageRes.arrayBuffer()).toString("base64")
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]
  const errors: string[] = []

  for (const model of models) {
    for (const authMethod of ["query", "header"] as const) {
      try {
        const url = authMethod === "query"
          ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
          : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (authMethod === "header") headers["x-goog-api-key"] = apiKey

        const res = await fetch(url, {
          method: "POST", headers,
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
            errors.push(`${model}/${authMethod}: ${res.status} ${(errJson.error?.message || "").slice(0, 60)}`)
          } catch { errors.push(`${model}/${authMethod}: ${res.status}`) }
        }
      } catch (e: any) { errors.push(`${model}/${authMethod}: ${e.message?.slice(0, 60)}`) }
    }
  }
  throw new Error(errors.join("; "))
}

async function analyzeWithGrok(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  let availableModels: string[] = []
  try {
    const listRes = await fetch("https://api.x.ai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } })
    if (listRes.ok) {
      availableModels = ((await listRes.json()).data || []).map((m: any) => m.id)
    }
  } catch {}

  const modelsToTry = [
    ...availableModels.filter(m => m.includes("vision") || m.includes("vl")),
    "grok-2-vision-1212", "grok-vision-beta", "grok-2-vision"
  ].filter((v, i, a) => a.indexOf(v) === i)

  const errors: string[] = []
  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ]}], temperature: 0.7, max_tokens: 1000,
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
        errors.push(`${model}: ${res.status} ${(await res.text()).slice(0, 60)}`)
      }
    } catch (e: any) { errors.push(`${model}: ${e.message?.slice(0, 60)}`) }
  }
  throw new Error(errors.join("; "))
}
