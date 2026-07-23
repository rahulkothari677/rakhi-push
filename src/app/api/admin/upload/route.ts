import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { requireAdmin } from "@/lib/admin-guard"

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary not configured")

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`
  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto.createHash("sha1").update(`folder=house-of-neelam&timestamp=${timestamp}${apiSecret}`).digest("hex")

  const formData = new FormData()
  formData.append("file", dataUri)
  formData.append("folder", "house-of-neelam")
  formData.append("timestamp", timestamp.toString())
  formData.append("api_key", apiKey)
  formData.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData })
  if (!res.ok) throw new Error(`Cloudinary: ${res.status} ${await res.text()}`)
  return (await res.json()).secure_url
}

async function uploadToLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await fs.mkdir(uploadDir, { recursive: true }).catch(() => {})
  const ext = path.extname(file.name) || ".jpg"
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext.toLowerCase()) ? ext.toLowerCase() : ".jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${filename}`
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isVercel = process.env.VERCEL === "1"
  const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

  if (isVercel && !hasCloudinary) {
    return NextResponse.json({ error: "Cloudinary required on Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET env vars.", needsCloudinary: true }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 })

    const urls: string[] = []
    for (const file of files) {
      if (!(file instanceof File)) continue
      urls.push(hasCloudinary ? await uploadToCloudinary(file) : await uploadToLocal(file))
    }
    return NextResponse.json({ urls, storage: hasCloudinary ? "cloudinary" : "local" })
  } catch (e: any) {
    console.error("Upload error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
