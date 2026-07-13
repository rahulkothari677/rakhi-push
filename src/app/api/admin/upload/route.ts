import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { requireAdmin } from "@/lib/admin-guard"

// Try Cloudinary if env vars are set (required for Vercel), else fall back to local FS
async function uploadToCloudinary(file: File): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return null

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const mime = file.type || "image/jpeg"
  const dataUri = `data:${mime};base64,${base64}`

  // Use unsigned upload via upload preset — but for signed admin uploads we use basic auth
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
      },
      body: JSON.stringify({
        file: dataUri,
        folder: "house-of-neelam",
        resource_type: "image",
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    console.error("Cloudinary upload failed:", err)
    return null
  }
  const data = await res.json()
  return data.secure_url as string
}

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

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const urls: string[] = []
    const useCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )

    for (const file of files) {
      if (!(file instanceof File)) continue
      let url: string | null = null
      if (useCloudinary) {
        url = await uploadToCloudinary(file)
      }
      if (!url) {
        // Fallback to local FS
        url = await uploadToLocal(file)
      }
      urls.push(url)
    }

    return NextResponse.json({ urls, storage: useCloudinary ? "cloudinary" : "local" })
  } catch (e: any) {
    console.error("Upload error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
