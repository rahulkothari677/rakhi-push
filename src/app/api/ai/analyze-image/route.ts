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

    // ─── Try Google Gemini first ─────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY
    if (!analysis && geminiKey) {
      try {
        console.log("[AI] Trying Google Gemini...")
        analysis = await analyzeWithGemini(imageUrl, prompt, geminiKey)
        providerUsed = "Google Gemini"
      } catch (e: any) {
        console.error("[AI] Gemini failed:", e.message)
      }
    }

    // ─── Try xAI Grok second ─────────────────────────────────────────────
    const grokKey = process.env.XAI_API_KEY
    if (!analysis && grokKey) {
      try {
        console.log("[AI] Trying xAI Grok...")
        analysis = await analyzeWithGrok(imageUrl, prompt, grokKey)
        providerUsed = "xAI Grok"
      } catch (e: any) {
        console.error("[AI] Grok failed:", e.message)
      }
    }

    // ─── Try z-ai-web-dev-sdk as fallback ────────────────────────────────
    if (!analysis) {
      try {
        console.log("[AI] Trying z-ai-web-dev-sdk...")
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()

        const response = await zai.chat.completions.createVision({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
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
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0])
          }
        }
        providerUsed = "Z-AI (default)"
      } catch (e: any) {
        console.error("[AI] z-ai failed:", e.message)
      }
    }

    if (!analysis) {
      return NextResponse.json(
        {
          error: "All AI providers failed. Set GEMINI_API_KEY or XAI_API_KEY env var in Vercel. See instructions in admin panel.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ analysis, provider: providerUsed })
  } catch (e: any) {
    console.error("AI analyze error:", e)
    return NextResponse.json(
      { error: e.message || "AI analysis failed" },
      { status: 500 }
    )
  }
}

// ─── Google Gemini ───────────────────────────────────────────────────────────
async function analyzeWithGemini(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  // Fetch the image and convert to base64
  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()
  const base64 = Buffer.from(imageBuffer).toString("base64")
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg"

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

  // Strip markdown
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  try {
    return JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error("Gemini returned invalid JSON")
  }
}

// ─── xAI Grok ────────────────────────────────────────────────────────────────
async function analyzeWithGrok(imageUrl: string, prompt: string, apiKey: string): Promise<any> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-vision-beta",
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
    const err = await res.text()
    throw new Error(`Grok API error: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  let content = data.choices?.[0]?.message?.content || ""

  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  try {
    return JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error("Grok returned invalid JSON")
  }
}
