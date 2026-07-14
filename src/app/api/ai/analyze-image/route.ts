import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"

// AI-powered image analysis — auto-fills product details from uploaded image
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

    // Use z-ai SDK for vision analysis (available on the server)
    const ZAI = (await import("z-ai-web-dev-sdk")).default
    const zai = await ZAI.create()

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

    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    let analysis
    try {
      analysis = JSON.parse(content)
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("AI returned invalid JSON: " + content.slice(0, 200))
      }
    }

    return NextResponse.json({ analysis })
  } catch (e: any) {
    console.error("AI analyze error:", e)
    return NextResponse.json(
      { error: e.message || "AI analysis failed" },
      { status: 500 }
    )
  }
}
