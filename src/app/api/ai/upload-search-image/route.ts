import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

/**
 * PUBLIC endpoint — any visitor can upload ONE image for AI visual search.
 *
 * Security:
 *   - Only image MIME types accepted (image/jpeg, image/png, image/webp, image/gif)
 *   - Max file size: 5 MB
 *   - Files stored in a separate `house-of-neelam/search` Cloudinary folder (or
 *     /public/uploads/search locally) so they can be cleaned up later
 *   - No admin auth required — this is a public search feature
 *
 * Returns: { url: string, storage: "cloudinary" | "local" }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate MIME type — only images allowed
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    const contentType = (file.type || "").toLowerCase()
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type || "unknown"}. Only JPEG, PNG, WebP, and GIF images are allowed.` },
        { status: 415 }
      )
    }

    // Validate file size — max 5 MB
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum allowed is 5 MB.` },
        { status: 413 }
      )
    }

    const isVercel = process.env.VERCEL === "1"
    const hasCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )

    if (isVercel && !hasCloudinary) {
      return NextResponse.json(
        { error: "Image storage not configured. Please contact support." },
        { status: 503 }
      )
    }

    let url: string
    let storage: "cloudinary" | "local"

    if (hasCloudinary) {
      url = await uploadToCloudinary(file)
      storage = "cloudinary"
    } else {
      url = await uploadToLocal(file)
      storage = "local"
    }

    return NextResponse.json({ url, storage })
  } catch (e: any) {
    console.error("[AI Search Upload] Error:", e)
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`
  const timestamp = Math.round(Date.now() / 1000)
  // Use a dedicated "search" folder so these user-uploaded images are
  // isolated from product/admin images and can be cleaned up periodically.
  const signature = crypto
    .createHash("sha1")
    .update(`folder=house-of-neelam/search&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const formData = new FormData()
  formData.append("file", dataUri)
  formData.append("folder", "house-of-neelam/search")
  formData.append("timestamp", timestamp.toString())
  formData.append("api_key", apiKey)
  formData.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Cloudinary upload failed: ${res.status} ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.secure_url
}

async function uploadToLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "search")
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {})

  const ext = path.extname(file.name) || ".jpg"
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext.toLowerCase())
    ? ext.toLowerCase()
    : ".jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`

  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/search/${filename}`
}
