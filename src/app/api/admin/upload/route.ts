import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { requireAdmin } from "@/lib/admin-guard"

// ─── Cloudinary Upload (signed) ─────────────────────────────────────────────
async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars not set")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const mime = file.type || "image/jpeg"
  const dataUri = `data:${mime};base64,${base64}`

  const timestamp = Math.round(Date.now() / 1000)
  const folder = "house-of-neelam"

  const paramsToSign: Record<string, string> = {
    folder,
    timestamp: timestamp.toString(),
  }

  const signatureString = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&")

  const signature = crypto
    .createHash("sha1")
    .update(signatureString + apiSecret)
    .digest("hex")

  const formData = new FormData()
  formData.append("file", dataUri)
  formData.append("folder", folder)
  formData.append("timestamp", timestamp.toString())
  formData.append("api_key", apiKey)
  formData.append("signature", signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Cloudinary error: ${res.status} ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.secure_url as string
}

// ─── Local Upload (development only) ────────────────────────────────────────
async function uploadToLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  try {
    await fs.mkdir(uploadDir, { recursive: true })
  } catch {}

  const ext = path.extname(file.name) || ".jpg"
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext.toLowerCase())
    ? ext.toLowerCase()
    : ".jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`
  const filepath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filepath, buffer)
  return `/uploads/${filename}`
}

// ─── Upload Handler ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isVercel = process.env.VERCEL === "1"
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )

  // On Vercel, Cloudinary is REQUIRED (local FS is read-only)
  if (isVercel && !hasCloudinary) {
    return NextResponse.json(
      {
        error:
          "Image upload requires Cloudinary on Vercel. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET env vars in Vercel. Sign up free at https://cloudinary.com",
        needsCloudinary: true,
      },
      { status: 500 }
    )
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const urls: string[] = []
    for (const file of files) {
      if (!(file instanceof File)) continue
      let url: string | null = null

      if (hasCloudinary) {
        url = await uploadToCloudinary(file)
      } else {
        url = await uploadToLocal(file)
      }
      urls.push(url)
    }

    return NextResponse.json({
      urls,
      storage: hasCloudinary ? "cloudinary" : "local",
    })
  } catch (e: any) {
    console.error("Upload error:", e)
    return NextResponse.json(
      { error: e.message || "Upload failed" },
      { status: 500 }
    )
  }
}
