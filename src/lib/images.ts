// Cloudinary image URL helpers
// Adds on-the-fly resizing, cropping, and optimization to Cloudinary URLs
// Falls back to original URL if not a Cloudinary URL (e.g. local /uploads/ or /images/)

type ImageOpts = {
  // Target width in pixels
  width?: number
  // Target height in pixels
  height?: number
  // Crop mode: 'fill' (cover/crop), 'pad' (contain with background), 'limit' (only shrink), 'thumb' (with face detection)
  crop?: "fill" | "pad" | "fit" | "limit" | "thumb" | "scale"
  // Gravity for cropping: 'auto' (smart object detection), 'face', 'center'
  gravity?: "auto" | "face" | "center" | "faces"
  // Quality (1-100 or 'auto')
  quality?: number | "auto"
  // Format: 'auto' lets Cloudinary pick the best format (webp for modern browsers)
  format?: "auto" | "webp" | "jpg" | "png"
  // Additional dpr (device pixel ratio) for retina displays
  dpr?: "auto" | number
  // Background color for padding (hex without #, e.g. 'F4EAD5')
  background?: string
}

/**
 * Transform a Cloudinary URL to add resizing/cropping/optimization.
 *
 * For non-Cloudinary URLs (local /uploads/, /images/, etc.), returns the original URL unchanged
 * since we can't transform those on the fly.
 *
 * @example
 * // Get a 400x400 padded image (shows full image with cream background)
 * transformImage(url, { width: 400, height: 400, crop: 'pad', background: 'F4EAD5' })
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
    crop = "pad",
    gravity = "auto",
    quality = "auto",
    format = "auto",
    dpr,
    background,
  } = opts

  // Build the transformation string
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

  // Insert the transformation into the URL
  return url.replace(
    "/image/upload/",
    `/image/upload/${transformStr}/`
  )
}

// Cream background color (matches the site's ivory/cream theme)
const CREAM_BG = "F4EAD5"
const IVORY_BG = "FBF6EC"

// ─── Preset transformations for common use cases ────────────────────────────

/**
 * Square product image (600x600) — PAD mode shows full image with cream background
 * Perfect for product cards, wishlist items — NO CROPPING, full image always visible
 */
export function productImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 600,
    height: 600,
    crop: "pad",
    background: IVORY_BG,
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Large product image for the product detail page (1000x1000) — PAD mode, no cropping
 */
export function productImageLarge(url: string | undefined | null): string {
  return transformImage(url, {
    width: 1000,
    height: 1000,
    crop: "pad",
    background: IVORY_BG,
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Thumbnail for admin tables, cart items (120x120) — PAD mode, no cropping
 */
export function thumbnailImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 120,
    height: 120,
    crop: "pad",
    background: CREAM_BG,
    quality: "auto",
    format: "auto",
  })
}

/**
 * Category image — landscape 16:10 ratio (640x400) — PAD mode shows full image
 * Perfect for category cards on admin panel
 */
export function categoryImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 640,
    height: 400,
    crop: "pad",
    background: CREAM_BG,
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Category image — portrait 4:5 ratio (500x625) for homepage grid — PAD mode
 */
export function categoryImagePortrait(url: string | undefined | null): string {
  return transformImage(url, {
    width: 500,
    height: 625,
    crop: "pad",
    background: CREAM_BG,
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Category thumbnail for header mega menu, shop pills, sidebar (100x100) — PAD mode
 */
export function categoryThumbnail(url: string | undefined | null): string {
  return transformImage(url, {
    width: 100,
    height: 100,
    crop: "pad",
    background: CREAM_BG,
    quality: "auto",
    format: "auto",
  })
}

/**
 * Hero slide image — full width, LIMIT mode (no cropping, maintains aspect ratio)
 * Landscape images display perfectly without cropping
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
 * Festive CTA image (Roli-Chawal Thali section) — square 800x800 — PAD mode, no cropping
 */
export function ctaImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 800,
    height: 800,
    crop: "pad",
    background: IVORY_BG,
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}

/**
 * Info page image — landscape 2:1 (1200x600) — PAD mode shows full image
 */
export function infoImage(url: string | undefined | null): string {
  return transformImage(url, {
    width: 1200,
    height: 600,
    crop: "pad",
    background: CREAM_BG,
    quality: "auto",
    format: "auto",
    dpr: "auto",
  })
}
