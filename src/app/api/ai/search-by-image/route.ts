import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"

// AI-powered image search — user uploads a Rakhi photo, AI finds similar products
export async function POST(req: Request) {
  // This endpoint doesn't require admin — any user can search by image
  // But we need to handle it differently from admin-only endpoints

  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 })
    }

    const prompt = `You are helping a customer find Rakhis on "House of Neelam" store.

Look at this image and describe the Rakhi in 3-5 keywords that could be used to search for similar products.

Focus on:
- Type (traditional, designer, kids, lumba, gold, silver, handmade, personalized)
- Color (red, gold, silver, pink, blue, etc.)
- Material (pearl, silk, thread, metal, beads, etc.)
- Style (floral, peacock, simple, ornate, etc.)

Return ONLY a JSON object:
{"searchQuery": "keyword1 keyword2 keyword3", "category": "best matching category name or null"}

Categories: Traditional Rakhi, Designer Rakhi, Kids Rakhi, Bhaiya-Bhabhi (Lumba), Premium Gold Rakhi, Silver Rakhi, Handmade Rakhi, Personalized Rakhi, Roli-Chawal & Thali`

    const geminiKey = process.env.GEMINI_API_KEY
    const grokKey = process.env.XAI_API_KEY

    let analysis = null

    // Try Gemini via OpenAI endpoint
    if (!analysis && geminiKey) {
      try {
        const imageRes = await fetch(imageUrl, { redirect: "follow" })
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
              max_tokens: 200,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            const content = data.choices?.[0]?.message?.content || ""
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
            try { analysis = JSON.parse(cleaned) } catch {
              const m = cleaned.match(/\{[\s\S]*\}/)
              if (m) analysis = JSON.parse(m[0])
            }
          }
        }
      } catch (e: any) {
        console.error("[AI Search] Gemini failed:", e.message)
      }
    }

    // Try Grok
    if (!analysis && grokKey) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({
            model: "grok-2-vision-1212",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            }],
            max_tokens: 200,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const content = data.choices?.[0]?.message?.content || ""
          const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
          try { analysis = JSON.parse(cleaned) } catch {
            const m = cleaned.match(/\{[\s\S]*\}/)
            if (m) analysis = JSON.parse(m[0])
          }
        }
      } catch (e: any) {
        console.error("[AI Search] Grok failed:", e.message)
      }
    }

    // Try built-in AI
    if (!analysis) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default
        const zai = await ZAI.create()
        const response = await zai.chat.completions.createVision({
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ]}],
          thinking: { type: "disabled" },
        })
        let content = response.choices[0]?.message?.content || ""
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        try { analysis = JSON.parse(content) } catch {
          const m = content.match(/\{[\s\S]*\}/)
          if (m) analysis = JSON.parse(m[0])
        }
      } catch (e: any) {
        console.error("[AI Search] Built-in failed:", e.message)
      }
    }

    if (!analysis) {
      return NextResponse.json({ error: "Could not analyze image. Please try text search instead." }, { status: 500 })
    }

    return NextResponse.json(analysis)
  } catch (e: any) {
    console.error("[AI Search] Error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
