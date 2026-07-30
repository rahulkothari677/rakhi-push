import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import { db } from "@/lib/db"
import { slugify, generateSKU } from "@/lib/utils"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

/**
 * Bulk Upload + AI — admin uploads 10+ images at once.
 *
 * Flow:
 *   1. Upload all images to Cloudinary (or local in dev) — fast, parallel
 *   2. Fetch actual categories from DB so AI returns valid names
 *   3. For each image, run AI analysis (parallel, with concurrency limit)
 *   4. Auto-create product with AI-filled fields
 *   5. Return per-image results: { success, productId?, error?, analysis? }
 *
 * The frontend shows a progress bar and allows skip/retry for failed items.
 *
 * Body: { images: File[] (multipart), defaultCategory?: string, defaultPrice?: number }
 * Returns: { results: [{ filename, imageUrl, success, productId?, productSlug?, error?, analysis? }] }
 */
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    const defaultCategory = formData.get("defaultCategory") as string | null
    const defaultPrice = formData.get("defaultPrice") as string | null

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Limit to 30 images per bulk upload to prevent timeouts
    if (files.length > 30) {
      return NextResponse.json(
        { error: "Maximum 30 images per bulk upload. Please upload in batches." },
        { status: 400 }
      )
    }

    // Fetch actual categories from DB so AI returns valid names
    let categories: { id: string; name: string }[] = []
    try {
      const catsRes = await fetch(`${new URL(req.url).origin}/api/categories`)
      const catsData = await catsRes.json()
      categories = (catsData.categories || []).map((c: any) => ({ id: c.id, name: c.name }))
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch categories. Please ensure categories exist before bulk upload." },
        { status: 500 }
      )
    }

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "No categories found. Please create at least one category first." },
        { status: 400 }
      )
    }

    const categoryNames = categories.map((c) => c.name)
    const isVercel = process.env.VERCEL === "1"
    const hasCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )

    if (isVercel && !hasCloudinary) {
      return NextResponse.json(
        { error: "Cloudinary required on Vercel for image storage." },
        { status: 503 }
      )
    }

    // Step 1: Upload all images in parallel (concurrency: 5)
    const uploadResults = await parallelMap(files, 5, async (file, index) => {
      try {
        const url = hasCloudinary
          ? await uploadToCloudinary(file)
          : await uploadToLocal(file)
        return { index, file, url, uploadError: null as string | null }
      } catch (e: any) {
        return { index, file, url: null, uploadError: e.message }
      }
    })

    // Step 2: Run AI analysis + create product for each uploaded image
    // Concurrency: 3 (lower because AI calls are heavier)
    const results = await parallelMap(uploadResults, 3, async (item) => {
      const { index, file, url, uploadError } = item

      if (uploadError || !url) {
        return {
          filename: file.name,
          imageUrl: null,
          success: false,
          error: `Upload failed: ${uploadError}`,
        }
      }

      try {
        // Run AI analysis
        const analysis = await analyzeRakhiImage(url, categoryNames)

        if (!analysis) {
          return {
            filename: file.name,
            imageUrl: url,
            success: false,
            error: "AI analysis failed — no valid response from AI provider",
          }
        }

        // Determine category — prefer AI's choice, fall back to default, then first category
        let chosenCategory = defaultCategory
        let chosenCategoryId: string | null = null

        if (analysis.category && categoryNames.includes(analysis.category)) {
          chosenCategory = analysis.category
        }
        if (!chosenCategory || !categoryNames.includes(chosenCategory)) {
          chosenCategory = categoryNames[0]
        }
        const matchedCat = categories.find((c) => c.name === chosenCategory)
        chosenCategoryId = matchedCat?.id || null

        // Determine price — prefer AI suggestion, fall back to default, then 99
        const price = analysis.suggestedPrice
          ? Number(analysis.suggestedPrice)
          : defaultPrice
          ? Number(defaultPrice)
          : 99

        // Create product
        const name = analysis.name || `Rakhi ${Date.now()}-${index}`
        const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)
        const finalSku = generateSKU()

        const product = await db.product.create({
          data: {
            slug,
            name,
            category: chosenCategory,
            categoryId: chosenCategoryId,
            price,
            compareAtPrice: null,
            images: JSON.stringify([url]),
            primaryImage: url,
            imagesMobile: JSON.stringify([url]),
            primaryImageMobile: url,
            shortDescription: analysis.shortDescription || "",
            description: analysis.description || "",
            materials: JSON.stringify(analysis.materials || []),
            features: JSON.stringify(analysis.features || []),
            badge: analysis.badge || null,
            inStock: 50,
            isFeatured: false,
            isActive: true,
            sku: finalSku,
          },
        })

        return {
          filename: file.name,
          imageUrl: url,
          success: true,
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          price: product.price,
          category: product.category,
          analysis,
        }
      } catch (e: any) {
        console.error(`[Bulk Upload] Item ${index} failed:`, e)
        return {
          filename: file.name,
          imageUrl: url,
          success: false,
          error: e.message || "Unknown error",
        }
      }
    })

    const successCount = results.filter((r) => r.success).length
    const failCount = results.length - successCount

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    })
  } catch (e: any) {
    console.error("[Bulk Upload] Error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function parallelMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++
      results[currentIndex] = await fn(items[currentIndex], currentIndex)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`
  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto
    .createHash("sha1")
    .update(`folder=house-of-neelam/products&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const formData = new FormData()
  formData.append("file", dataUri)
  formData.append("folder", "house-of-neelam/products")
  formData.append("timestamp", timestamp.toString())
  formData.append("api_key", apiKey)
  formData.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new Error(`Cloudinary: ${res.status}`)
  return (await res.json()).secure_url
}

async function uploadToLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products")
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {})
  const ext = path.extname(file.name) || ".jpg"
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext.toLowerCase())
    ? ext.toLowerCase()
    : ".jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/products/${filename}`
}

async function analyzeRakhiImage(
  imageUrl: string,
  categoryNames: string[]
): Promise<any | null> {
  const prompt = `You are an expert Rakhi product catalog manager for "House of Neelam".

Analyze this Rakhi product image and provide ALL details:

1. name: Premium elegant product name (2-6 words)
2. category: You MUST pick one of these EXACT category names: ${categoryNames.map((c) => `"${c}"`).join(", ")}
3. shortDescription: One-line description (max 80 chars)
4. description: Full 2-3 sentence description
5. materials: Array of materials
6. features: Array of 3-4 features
7. suggestedPrice: Price in INR (integer, realistic for the Indian market: 30-5000)
8. badge: "New", "Bestseller", "Premium", "Luxury", "Handmade", or null

Return ONLY valid JSON (no markdown, no code fences):
{"name":"...","category":"...","shortDescription":"...","description":"...","materials":["..."],"features":["..."],"suggestedPrice":599,"badge":"Premium"}`

  // Helper to fetch image as base64
  async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const imageRes = await fetch(url, { redirect: "follow" })
      if (!imageRes.ok) return null
      const buffer = Buffer.from(await imageRes.arrayBuffer())
      return {
        base64: buffer.toString("base64"),
        mimeType: imageRes.headers.get("content-type") || "image/jpeg",
      }
    } catch {
      return null
    }
  }

  // Provider 1: GitHub Models (gpt-4o)
  const githubToken = process.env.GITHUB_TOKEN
  if (githubToken) {
    try {
      const imgData = await fetchImageAsBase64(imageUrl)
      if (imgData) {
        const res = await fetch("https://models.github.ai/inference/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${githubToken}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${imgData.mimeType};base64,${imgData.base64}` } },
              ],
            }],
            max_tokens: 500,
            temperature: 0.4,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const content = data.choices?.[0]?.message?.content || ""
          const parsed = parseJsonResponse(content)
          if (parsed) return parsed
        }
      }
    } catch (e: any) {
      console.error("[Bulk Upload AI] GitHub Models failed:", e.message)
    }
  }

  // Provider 2: Gemini native v1beta
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const imgData = await fetchImageAsBase64(imageUrl)
      if (imgData) {
        const res = await fetch(
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
              generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
            }),
          }
        )
        if (res.ok) {
          const data = await res.json()
          const parts = data?.candidates?.[0]?.content?.parts || []
          const textPart = parts.find((p: any) => typeof p.text === "string")
          const content = textPart?.text || ""
          const parsed = parseJsonResponse(content)
          if (parsed) return parsed
        }
      }
    } catch (e: any) {
      console.error("[Bulk Upload AI] Gemini failed:", e.message)
    }
  }

  // Provider 3: ZAI SDK (dev only)
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default
    const zai = await ZAI.create()
    const imgData = await fetchImageAsBase64(imageUrl)
    if (imgData) {
      const response = await zai.chat.completions.createVision({
        model: "glm-4.5v",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${imgData.mimeType};base64,${imgData.base64}` } },
          ],
        }],
        thinking: { type: "disabled" },
      })
      const content = response.choices?.[0]?.message?.content || ""
      const parsed = parseJsonResponse(content)
      if (parsed) return parsed
    }
  } catch (e: any) {
    console.error("[Bulk Upload AI] ZAI SDK failed:", e.message)
  }

  return null
}

function parseJsonResponse(content: string): any | null {
  if (!content || typeof content !== "string") return null
  let cleaned = content.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === "object" && parsed.name) return parsed
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed && typeof parsed === "object" && parsed.name) return parsed
    } catch {}
  }
  return null
}
