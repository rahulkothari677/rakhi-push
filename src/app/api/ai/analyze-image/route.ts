import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { requireAdmin } from "@/lib/admin-guard"

async function getImageData(imageUrl: string, reqHost: string | null): Promise<{ base64: string; mimeType: string }> {
  if (imageUrl.startsWith("data:")) {
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      return { mimeType: matches[1], base64: matches[2] }
    }
  }

  if (imageUrl.startsWith("/")) {
    try {
      const localPath = path.join(process.cwd(), "public", imageUrl)
      const buffer = await fs.readFile(localPath)
      const ext = path.extname(imageUrl).toLowerCase().replace(".", "")
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
      return { base64: buffer.toString("base64"), mimeType }
    } catch {}
  }

  let fullUrl = imageUrl
  if (imageUrl.startsWith("/")) {
    const baseURL = reqHost ? `https://${reqHost}` : "http://localhost:3000"
    fullUrl = `${baseURL}${imageUrl}`
  }

  const res = await fetch(fullUrl, { redirect: "follow" })
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const mimeType = res.headers.get("content-type") || "image/jpeg"
  return { base64, mimeType }
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: "Image URL required" }, { status: 400 })

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

    let imageData: { base64: string; mimeType: string } | null = null
    try {
      imageData = await getImageData(imageUrl, req.headers.get("host"))
    } catch (e: any) {
      return NextResponse.json({ error: `Could not load image: ${e.message}` }, { status: 400 })
    }

    let analysis = null
    let providerUsed = ""
    const allErrors: string[] = []

    const geminiKey = process.env.GEMINI_API_KEY
    const grokKey = process.env.XAI_API_KEY
    const githubToken = process.env.GITHUB_TOKEN

    // ─── 1. Try Google Gemini REST (Primary) ────────────────────────────
    if (!analysis && geminiKey) {
      try {
        console.log("[AI] Trying Google Gemini...")
        analysis = await analyzeWithGeminiREST(imageData.base64, imageData.mimeType, prompt, geminiKey)
        if (analysis) providerUsed = "Google Gemini"
      } catch (e: any) {
        allErrors.push(`Gemini: ${e.message}`)
        console.error("[AI] Gemini error:", e.message)
      }
    }

    // ─── 2. Try GitHub Models (Fallback) ──────────────────────────────────
    if (!analysis && githubToken) {
      try {
        console.log("[AI] Trying GitHub Models...")
        analysis = await analyzeWithGitHubModels(imageData.base64, imageData.mimeType, prompt, githubToken)
        if (analysis) providerUsed = "GitHub Models (Free)"
      } catch (e: any) {
        allErrors.push(`GitHub-Models: ${e.message}`)
      }
    }

    // ─── 3. Try Grok ────────────────────────────────────────────────────
    if (!analysis && grokKey) {
      try {
        console.log("[AI] Trying Grok...")
        analysis = await analyzeWithGrok(imageUrl, prompt, grokKey)
        if (analysis) providerUsed = "xAI Grok"
      } catch (e: any) {
        allErrors.push(`Grok: ${e.message}`)
      }
    }

    if (!analysis) {
      const errorStr = allErrors.join(" | ")
      let helpfulError = errorStr

      if (errorStr.includes("429") || errorStr.includes("quota")) {
        helpfulError = "Gemini quota exceeded or rate limited. Enable billing at https://console.cloud.google.com/billing or verify your key."
      }

      return NextResponse.json({ error: helpfulError, debug: errorStr.slice(0, 300) }, { status: 500 })
    }

    return NextResponse.json({ analysis, provider: providerUsed, debugErrors: allErrors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function analyzeWithGeminiREST(base64: string, mimeType: string, prompt: string, apiKey: string): Promise<any> {
  const models = ["gemini-3.5-flash", "gemini-flash-latest"]
  const errors: string[] = []

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ]}],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const parts = data.candidates?.[0]?.content?.parts || []
        const textPart = parts.find((p: any) => typeof p.text === "string")
        const content = textPart?.text || ""
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
          errors.push(`${model}: ${res.status} ${(errJson.error?.message || "").slice(0, 80)}`)
        } catch { errors.push(`${model}: ${res.status}`) }
      }
    } catch (e: any) {
      errors.push(`${model}: ${e.message?.slice(0, 80)}`)
    }
  }

  throw new Error(errors.join("; "))
}

async function analyzeWithGitHubModels(base64: string, mimeType: string, prompt: string, apiKey: string): Promise<any> {
  const models = ["gpt-4o-mini", "gpt-4o"]
  const errors: string[] = []

  for (const model of models) {
    try {
      const res = await fetch("https://models.github.ai/inference/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
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
          try { return JSON.parse(cleaned) } catch {}
          const m = cleaned.match(/\{[\s\S]*\}/)
          if (m) return JSON.parse(m[0])
        }
      } else {
        const errText = await res.text()
        try {
          const errJson = JSON.parse(errText)
          errors.push(`${model}: ${res.status} ${(errJson.error?.message || errText).slice(0, 80)}`)
        } catch {
          errors.push(`${model}: ${res.status} ${errText.slice(0, 80)}`)
        }
      }
    } catch (e: any) {
      errors.push(`${model}: ${e.message?.slice(0, 80)}`)
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


