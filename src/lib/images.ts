// Cloudinary image URL helpers
// All images use c_fill with g_auto (smart crop) to FILL boxes completely — no gaps, no padding

type ImageOpts = {
  width?: number
  height?: number
  crop?: "fill" | "pad" | "fit" | "limit" | "thumb" | "scale"
  gravity?: "auto" | "face" | "center" | "faces"
  quality?: number | "auto"
  format?: "auto" | "webp" | "jpg" | "png"
  dpr?: "auto" | number
  background?: string
}

export function transformImage(url: string | undefined | null, opts: ImageOpts = {}): string {
  if (!url) return ""
  if (!url.includes("res.cloudinary.com")) return url

  const {
    width,
    height,
    crop = "fill",
    gravity = "auto",
    quality = "auto",
    format = "auto",
    dpr,
    background,
  } = opts

  const transformations: string[] = []
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (crop) transformations.push(`c_${crop}`)
  if (gravity && (crop === "fill" || crop === "thumb")) transformations.push(`g_${gravity}`)
  transformations.push(`q_${quality}`)
  transformations.push(`f_${format}`)
  if (dpr) transformations.push(`dpr_${dpr}`)
  if (background && (crop === "pad" || crop === "fit")) transformations.push(`b_rgb:${background}`)

  const transformStr = transformations.join(",")
  return url.replace("/image/upload/", `/image/upload/${transformStr}/`)
}

// ─── Preset transformations — ALL use c_fill to fill boxes completely ───────

// Product image — portrait 4:5 (matches card aspect ratio, no gaps)
export function productImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 500,
    height: 625,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

export function productImageLarge(url: string | undefined | null): string {
  return transformImage(url, {
    width: 1000,
    height: 1000,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

export function thumbnailImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 120,
    height: 120,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  })
}

// Category image — landscape 16:10 (fills admin card completely)
export function categoryImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 640,
    height: 400,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

// Category image — portrait 4:5 (fills homepage grid completely, no gaps)
export function categoryImagePortrait(url: string | undefined | null): string {
  return transformImage(url, {
    width: 500,
    height: 625,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

export function categoryThumbnail(url: string | undefined | null): string {
  return transformImage(url, {
    width: 100,
    height: 100,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
  })
}

// Hero image — limit mode (no crop, maintains aspect ratio for wide banners)
export function heroImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 1920,
    crop: "limit",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

// CTA image — square (fills completely)
export function ctaImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 800,
    height: 800,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

// Info page image — landscape 2:1 (fills completely)
export function infoImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 1200,
    height: 600,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}
