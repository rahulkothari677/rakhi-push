// Quick test script — insert a test product with inStock=0 to verify out-of-stock UI
import { db } from "../src/lib/db"
import { ensureDB } from "../src/lib/ensure-db"

async function main() {
  await ensureDB()

  // Check if test product exists
  const existing = await db.product.findMany({ where: { slug: { contains: "test-out-of-stock" } } })
  if (existing.length > 0) {
    console.log("Test product already exists, updating to inStock=0...")
    await db.product.update({
      where: { id: existing[0].id },
      data: { inStock: 0 },
    })
    console.log("✅ Updated product to inStock=0")
  } else {
    console.log("Creating test product with inStock=0...")
    const categories = await db.category.findMany()
    const cat = categories[0]
    const product = await db.product.create({
      data: {
        slug: "test-out-of-stock-rakhi-" + Date.now(),
        name: "Test Out of Stock Rakhi (Premium)",
        category: cat?.name || "Designer Rakhi",
        categoryId: cat?.id || null,
        price: 599,
        compareAtPrice: 999,
        images: JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"]),
        primaryImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        imagesMobile: JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"]),
        primaryImageMobile: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        shortDescription: "Test product to verify out-of-stock UI",
        description: "This is a test product with inStock=0 to verify the out-of-stock badge and Notify Me button display correctly.",
        materials: JSON.stringify(["Thread", "Pearl"]),
        features: JSON.stringify(["Handcrafted", "Premium"]),
        badge: "Premium",
        inStock: 0,
        isActive: true,
        isFeatured: true,
        sku: "TEST-OOS-001",
      },
    })
    console.log("✅ Created test product:", product.name, "| inStock:", product.inStock)
  }

  // Also create an in-stock product for comparison
  const inStockExisting = await db.product.findMany({ where: { slug: { contains: "test-in-stock" } } })
  if (inStockExisting.length === 0) {
    const categories = await db.category.findMany()
    const cat = categories[0]
    await db.product.create({
      data: {
        slug: "test-in-stock-rakhi-" + Date.now(),
        name: "Test In Stock Rakhi",
        category: cat?.name || "Designer Rakhi",
        categoryId: cat?.id || null,
        price: 499,
        images: JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"]),
        primaryImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        imagesMobile: JSON.stringify(["https://res.cloudinary.com/demo/image/upload/sample.jpg"]),
        primaryImageMobile: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        shortDescription: "Test product in stock",
        description: "This product is in stock.",
        materials: JSON.stringify(["Thread"]),
        features: JSON.stringify(["Handcrafted"]),
        badge: "New",
        inStock: 25,
        isActive: true,
        isFeatured: true,
        sku: "TEST-IS-001",
      },
    })
    console.log("✅ Created in-stock comparison product")
  }

  console.log("\nDone! Open http://localhost:3000/ to see the out-of-stock product.")
}

main().catch(console.error)
