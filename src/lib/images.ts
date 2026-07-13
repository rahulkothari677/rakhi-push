// Cloudinary image URL helpers
// Adds on-the-fly resizing, cropping, and optimization to Cloudinary URLs
// Falls back to original URL if not a Cloudinary URL (e.g. local /uploads/ or /images/)

type ImageOpts = {
  // Target width in pixels
  width?: number
  // Target height in pixels
  height?: number
  // Crop mode: 'fill' (cover), 'fit' (contain), 'limit' (only shrink), 'thumb' (with face detection)
  crop?: "fill" | "fit" | "limit" | "thumb" | "scale"
  // Gravity for cropping: 'auto' (smart object detection), 'face', 'center'
  gravity?: "auto" | "face" | "center" | "faces"
  // Quality (1-100 or 'auto')
  quality?: number | "auto"
  // Format: 'auto' lets Cloudinary pick the best format (webp for modern browsers)
  format?: "auto" | "webp" | "jpg" | "png"
  // Additional dpr (device pixel ratio) for retina displays
  dpr?: "auto" | number
}

/**
 * Transform a Cloudinary URL to add resizing/cropping/optimization.
 *
 * For non-Cloudinary URLs (local /uploads/, /images/, etc.), returns the original URL unchanged
 * since we can't transform those on the fly.
 *
 * @example
 * // Get a 400x400 smart-cropped image
 * transformImage(url, { width: 400, height: 400, crop: 'fill', gravity: 'auto' })
 *
 * // Get a 800px wide image that maintains aspect ratio (no cropping)
 * transformImage(url, { width: 800, crop: 'fit' })
 */
export function transformImage(url: string | undefined | null, opts: ImageOpts = {}): string {
  if (!url) return ""

  // Only transform Cloudinary URLs
  // Cloudinary URLs look like: https://res.cloudinary.com/<cloud-name>/image/upload/...
  if (!url.includes("res.cloudinary.com")) {
    return url
  }

  const {
    width,
    height,
    crop = "fill",
    gravity = "auto",
    quality = "auto",
    format = "auto",
    dpr,
  } = opts

  // Build the transformation string
  // Cloudinary transformations are added between /upload/ and the rest of the path
  const transformations: string[] = []

  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (crop) transformations.push(`c_${crop}`)
  if (gravity && (crop === "fill" || crop === "thumb")) transformations.push(`g_${gravity}`)
  transformations.push(`q_${quality}`)
  transformations.push(`f_${format}`)
  if (dpr) transformations.push(`dpr_${dpr}`)

  const transformStr = transformations.join(",")

  // Insert the transformation into the URL
  // Original: https://res.cloudinary.com/<cloud>/image/upload/v123/photo.jpg
  // Transformed: https://res.cloudinary.com/<cloud>/image/upload/w_400,h_400,c_fill,g_auto,q_auto,f_auto/v123/photo.jpg
  return url.replace(
    "/image/upload/",
    `/image/upload/${transformStr}/`
  )
}

// ─── Preset transformations for common use cases ────────────────────────────

/**
 * Square product image (400x400) — smart crop with object detection
 * Perfect for product cards, product detail page main image, wishlist items
 */
export function productImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 600,
    height: 600,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Large product image for the product detail page (800x800)
 */
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

/**
 * Thumbnail for admin tables, cart items (100x100)
 */
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

/**
 * Category image — landscape 16:10 ratio (640x400) with smart crop
 * Perfect for category cards on home and admin
 */
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

/**
 * Category image — portrait 4:5 ratio (400x500) for homepage grid
 */
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

/**
 * Category thumbnail for header mega menu, shop pills, sidebar (80x80)
 */
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

/**
 * Hero slide image — full width, fit mode (no cropping, maintains aspect ratio)
 * Landscape images will display perfectly without cropping
 */
export function heroImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 1920,
    crop: "limit",
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Festive CTA image (Roli-Chawal Thali section) — square 600x600
 */
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

/**
 * Info page image — landscape 2:1 (1200x600) with smart crop
 */
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
