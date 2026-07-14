// Auto-initialization: ensures database tables exist and seed data is loaded
// Works with both local SQLite and Turso (libsql)
// Called automatically on first API request

import { db, getLibsqlClient, generateId, slugify, generateSKU } from "./db"
import bcrypt from "bcryptjs"

let initPromise: Promise<void> | null = null
let isInitialized = false

export async function ensureDB(): Promise<void> {
  if (isInitialized) return
  if (!initPromise) {
    initPromise = initializeDB().then(() => {
      isInitialized = true
    }).catch((err) => {
      console.error("[ensureDB] Initialization failed:", err)
      initPromise = null  // allow retry on next request
      throw err
    })
  }
  return initPromise
}

async function initializeDB(): Promise<void> {
  console.log("[ensureDB] Checking database state...")

  // Check if Product table exists by attempting a count
  let tablesExist = false
  try {
    await db.product.count({ take: 1 })
    tablesExist = true
    console.log("[ensureDB] Tables exist")
  } catch (err: any) {
    console.log("[ensureDB] Tables don't exist or DB not initialized:", err.message?.slice(0, 100))
  }

  if (!tablesExist) {
    console.log("[ensureDB] Creating schema via raw SQL...")
    await createTablesViaRawSQL()
    console.log("[ensureDB] Tables created")
  }

  // Check if admin user exists; if not, seed everything
  const adminCount = await db.user.count({ where: { role: "ADMIN" } })
  if (adminCount === 0) {
    console.log("[ensureDB] No admin user found, seeding demo data...")
    await seedDemoData()
    console.log("[ensureDB] Demo data seeded")
  } else {
    console.log("[ensureDB] Admin user exists, skipping seed")
  }

  // Always ensure story content has the new rich format (3 images, titleColor, etc.)
  const storyContent = await db.siteContent.findUnique({ where: { section: "story" } })
  if (!storyContent || !storyContent.data.includes("image2")) {
    console.log("[ensureDB] Updating story content with rich format...")
    const storyData = {
      title: "The Sacred Bond of Raksha Bandhan",
      titleColor: "#8B1E3E",
      titleFont: "font-serif",
      image: "/images/hero-1.svg",
      image2: "/images/hero-2.svg",
      image3: "/images/hero-3.svg",
      body: "In the heart of every Indian home, there exists a bond that transcends time — the sacred relationship between a brother and sister. Raksha Bandhan celebrates this eternal connection, weaving together threads of love, protection, and devotion.\n\nThe word 'Raksha' means protection, and 'Bandhan' means bond. Together, they form a promise — a sacred vow that has echoed through millennia, from the palaces of ancient kings to the homes of today.\n\n---\n\nLegend speaks of Queen Karnawati of Chittor, who sent a Rakhi to Emperor Humayun in her hour of need. Touched by this sacred thread, the mighty emperor rode to her aid, honoring the bond that knew no boundaries of religion or kingdom.\n\nThrough the ages, this tradition has only grown stronger. Today, when a sister ties the Rakhi on her brother's wrist, she doesn't just tie a thread — she ties a piece of her heart. And when the brother promises to protect her, he doesn't just speak words — he makes a vow that echoes through lifetimes.\n\n---\n\nAt House of Neelam, we understand the weight of this sacred moment. Every Rakhi we craft is not merely an accessory — it is a vessel of love, a symbol of devotion, a thread that binds hearts across distances.\n\nFrom the sacred moli threads blessed by generations of artisans to the diamond-studded luxury pieces that catch the light of a thousand celebrations, each Rakhi tells a story. Your story.\n\nThis Raksha Bandhan, let us help you write the next chapter. Because some bonds are forever — and they deserve to be celebrated with beauty worthy of their depth."
    }
    await db.siteContent.upsert({
      where: { section: "story" },
      create: { section: "story", data: JSON.stringify(storyData) },
      update: { data: JSON.stringify(storyData) },
    })
    console.log("[ensureDB] Story content updated")
  }
}

// Raw SQL to create all tables — works for both SQLite and Turso (libsql)
async function createTablesViaRawSQL(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "passwordHash" TEXT,
      "role" TEXT NOT NULL DEFAULT 'ADMIN',
      "phone" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

    `CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "description" TEXT,
      "image" TEXT,
      "icon" TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug")`,

    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "categoryId" TEXT,
      "price" INTEGER NOT NULL,
      "compareAtPrice" INTEGER,
      "images" TEXT NOT NULL,
      "primaryImage" TEXT NOT NULL,
      "shortDescription" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "materials" TEXT NOT NULL,
      "features" TEXT NOT NULL,
      "sku" TEXT NOT NULL,
      "badge" TEXT,
      "inStock" INTEGER NOT NULL DEFAULT 50,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "isFeatured" BOOLEAN NOT NULL DEFAULT false,
      "rating" REAL NOT NULL DEFAULT 5.0,
      "reviewCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku")`,

    `CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderNumber" TEXT NOT NULL,
      "userId" TEXT,
      "customerName" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "customerEmail" TEXT,
      "customerAddress" TEXT,
      "customerCity" TEXT,
      "customerState" TEXT,
      "customerPincode" TEXT,
      "customerNotes" TEXT,
      "subtotal" INTEGER NOT NULL,
      "shipping" INTEGER NOT NULL DEFAULT 0,
      "total" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "whatsappSentAt" DATETIME,
      "adminNotes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber")`,

    `CREATE TABLE IF NOT EXISTS "OrderItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "productId" TEXT,
      "name" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS "WishlistItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId")`,

    `CREATE TABLE IF NOT EXISTS "SiteSetting" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SiteSetting_key_key" ON "SiteSetting"("key")`,

    `CREATE TABLE IF NOT EXISTS "HeroSlide" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "subtitle" TEXT NOT NULL,
      "description" TEXT,
      "image" TEXT NOT NULL,
      "ctaLabel" TEXT,
      "ctaLink" TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS "SiteContent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "section" TEXT NOT NULL,
      "data" TEXT NOT NULL,
      "updatedAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SiteContent_section_key" ON "SiteContent"("section")`,
  ]

  // Use direct libsql client for ALL table creation (works on both local + Vercel)
  console.log("[ensureDB] Creating tables via libsql client...")
  const client = getLibsqlClient()
  for (const sql of statements) {
    try {
      await client.execute(sql)
    } catch (err: any) {
      if (!err.message?.includes("already exists")) {
        console.error("[ensureDB] SQL error:", err.message?.slice(0, 200))
      }
    }
  }
  console.log("[ensureDB] Tables created")
}

async function seedDemoData(): Promise<void> {
  // 1. Create admin user
  const adminEmail = "admin@houseofneelam.com"
  const adminPassword = "Neelam@Admin2026"
  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await db.user.create({
    data: {
      email: adminEmail,
      name: "Neelam (Admin)",
      passwordHash,
      role: "ADMIN",
      phone: "+919504970435",
    },
  })
  console.log("[ensureDB] Admin user created")

  // 2. Create categories
  const categories = [
    { name: "Traditional Rakhi", description: "Timeless traditional Rakhis crafted with sacred threads, beads, and motifs — celebrating the eternal bond.", icon: "🪔" },
    { name: "Designer Rakhi", description: "Contemporary designer Rakhis with modern aesthetics — for the brother who appreciates style.", icon: "✨" },
    { name: "Kids Rakhi", description: "Playful, colorful Rakhis for children featuring their favorite characters and themes.", icon: "🧸" },
    { name: "Bhaiya-Bhabhi (Lumba)", description: "Elegant Lumba Rakhis specially designed for sister-in-law, celebrating the sacred bhaiya-bhabhi bond.", icon: "💞" },
    { name: "Premium Gold Rakhi", description: "Luxurious gold-plated Rakhis — the epitome of opulence and craftsmanship.", icon: "👑" },
    { name: "Silver Rakhi", description: "Pure silver Rakhis with intricate filigree — timeless heirlooms of love.", icon: "🥈" },
    { name: "Handmade Rakhi", description: "Handcrafted with love by artisans — each Rakhi a unique piece of art.", icon: "🤲" },
    { name: "Personalized Rakhi", description: "Customized Rakhis with names, photos, and personal messages.", icon: "💝" },
    { name: "Roli-Chawal & Thali", description: "Sacred roli, chawal, and decorative thalis — complete your Raksha Bandhan rituals.", icon: "🌾" },
  ]

  const catMap: Record<string, string> = {}
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]
    const created = await db.category.create({
      data: {
        name: c.name,
        slug: slugify(c.name) + "-" + Math.random().toString(36).slice(2, 6),
        description: c.description,
        icon: c.icon,
        image: `/images/category-${i + 1}.svg`,
        order: i,
        isActive: true,
      },
    })
    catMap[c.name] = created.id
  }
  console.log("[ensureDB] Categories created")

  // 3. Create products
  const products = [
    {
      name: "Imperial Gold Peacock Rakhi",
      category: "Premium Gold Rakhi",
      price: 1499, compareAtPrice: 2199,
      shortDescription: "Majestic peacock motif in 22K gold-plated brass with intricate Kundan work.",
      description: "An exquisite expression of love and tradition, the Imperial Gold Peacock Rakhi is crafted with meticulous attention to detail. The peacock, a symbol of grace and beauty in Indian culture, is rendered in 22K gold plating with hand-set Kundan stones. The sacred red thread (moli) is interwoven with golden zari, making this Rakhi a true heirloom piece that your brother will treasure for years to come.",
      materials: ["22K Gold-plated brass", "Kundan stones", "Silk moli thread", "Zari work"],
      features: ["Handcrafted", "Premium gold plating", "Heirloom quality", "Comes in gift box"],
      badge: "Bestseller", isFeatured: true, image: "rakhi-gold-peacock",
    },
    {
      name: "Silver Filigree Lotus Rakhi",
      category: "Silver Rakhi",
      price: 899, compareAtPrice: 1299,
      shortDescription: "Pure 925 silver lotus motif with delicate filigree work.",
      description: "The Silver Filigree Lotus Rakhi embodies purity and devotion. Handcrafted in 925 sterling silver, the lotus motif symbolizes spiritual awakening and the unbreakable bond between siblings. Each curve of the filigree work is shaped by master artisans in Jaipur, carrying forward a centuries-old tradition.",
      materials: ["925 Sterling silver", "Silk thread", "Cotton moli"],
      features: ["925 hallmarked silver", "Handmade filigree", "Anti-tarnish coating", "Gift wrapped"],
      badge: "Premium", isFeatured: true, image: "rakhi-silver-lotus",
    },
    {
      name: "Royal Velvet Bhaiya-Bhabhi Lumba Set",
      category: "Bhaiya-Bhabhi (Lumba)",
      price: 1199, compareAtPrice: 1799,
      shortDescription: "Exquisite lumba pair for bhaiya-bhabhi in royal velvet with golden embellishments.",
      description: "Celebrate the sacred bond with both your brother and sister-in-law with this stunning Lumba set. The pair features royal velvet bases adorned with golden beads, pearl drops, and intricate embroidery. The Lumba (for bhabhi) is designed with a traditional pendant style that graces the wrist elegantly.",
      materials: ["Royal velvet", "Golden beads", "Freshwater pearls", "Silk thread"],
      features: ["Set of 2 (Rakhi + Lumba)", "Pearl embellishments", "Royal velvet finish", "Festive gift box"],
      badge: "Set of 2", isFeatured: true, image: "rakhi-lumba-velvet",
    },
    {
      name: "Sacred Moli Traditional Rakhi",
      category: "Traditional Rakhi",
      price: 199, compareAtPrice: 299,
      shortDescription: "Pure traditional rakhi with sacred red moli thread and silver-plated center.",
      description: "Return to the roots with this authentic traditional Rakhi. The sacred red moli thread, hand-wound and blessed, holds a silver-plated center motif. Simple, pure, and deeply meaningful — this Rakhi carries the essence of Raksha Bandhan as it has been celebrated for centuries.",
      materials: ["Pure moli thread", "Silver-plated motif", "Cotton thread"],
      features: ["Traditional design", "Sacred thread", "Hand-wound", "Set of 2"],
      image: "rakhi-traditional-moli",
    },
    {
      name: "Champa Designer Crystal Rakhi",
      category: "Designer Rakhi",
      price: 649, compareAtPrice: 899,
      shortDescription: "Modern designer Rakhi with crystal center and pearl drops.",
      description: "Where tradition meets contemporary design — the Champa Designer Crystal Rakhi features a stunning crystal centerpiece surrounded by delicate pearl drops. The ribbon-style thread is comfortable to wear and adds a modern touch while retaining the sacred essence of the festival.",
      materials: ["Crystal center", "Pearl drops", "Satin ribbon", "Metal alloy base"],
      features: ["Designer piece", "Crystal embellishment", "Comfortable ribbon", "Modern aesthetic"],
      badge: "New", isFeatured: true, image: "rakhi-designer-crystal",
    },
    {
      name: "Cute Avengers Kids Rakhi",
      category: "Kids Rakhi",
      price: 149, compareAtPrice: 249,
      shortDescription: "Fun superhero-themed Rakhi for the little brother who loves adventure.",
      description: "Make Raksha Bandhan exciting for your little brother with this colorful superhero-themed Rakhi. Featuring safe, child-friendly materials and bright, engaging colors, this Rakhi will make him smile all day long.",
      materials: ["Child-safe materials", "Colorful threads", "Plastic motif"],
      features: ["Kid-friendly", "Bright colors", "Safe materials", "Superhero theme"],
      badge: "Kids", image: "rakhi-kids-superhero",
    },
    {
      name: "Paw Patrol Kids Rakhi",
      category: "Kids Rakhi",
      price: 149,
      shortDescription: "Adorable puppy-themed Rakhi for young brothers.",
      description: "A delightful Rakhi featuring beloved puppy characters that your little brother will adore. Made with soft, comfortable threads and bright, eye-catching colors.",
      materials: ["Soft fabric", "Cotton thread", "Safe colors"],
      features: ["Cute design", "Soft material", "Comfortable fit", "Kid approved"],
      badge: "Kids", image: "rakhi-kids-puppy",
    },
    {
      name: "Handwoven Macrame Rakhi",
      category: "Handmade Rakhi",
      price: 349, compareAtPrice: 499,
      shortDescription: "Beautifully handwoven macrame Rakhi by rural artisans.",
      description: "Each Handwoven Macrame Rakhi is a unique piece of art, crafted by skilled rural artisans using traditional knotting techniques passed down through generations. The natural cotton threads create intricate patterns that are both beautiful and sustainable.",
      materials: ["Natural cotton", "Macrame knots", "Wooden beads"],
      features: ["100% handmade", "Natural materials", "Supports artisans", "Eco-friendly"],
      badge: "Handmade", isFeatured: true, image: "rakhi-handmade-macrame",
    },
    {
      name: "Personalized Name Rakhi",
      category: "Personalized Rakhi",
      price: 499,
      shortDescription: "Custom Rakhi with your brother's name engraved in golden letters.",
      description: "Make this Raksha Bandhan truly special with a Personalized Name Rakhi. Your brother's name is elegantly engraved in golden letters on a premium base, creating a one-of-a-kind keepsake. Each piece is custom-made to order.",
      materials: ["Premium metal base", "Gold lettering", "Silk thread"],
      features: ["Customizable name", "Made to order", "Personal touch", "Gift boxed"],
      badge: "Personalized", image: "rakhi-personalized-name",
    },
    {
      name: "Diamond Studded Premium Rakhi",
      category: "Premium Gold Rakhi",
      price: 2499, compareAtPrice: 3499,
      shortDescription: "Luxury Rakhi with diamond-studded center in rose gold finish.",
      description: "The pinnacle of Rakhi craftsmanship — this Diamond Studded Premium Rakhi features a rose gold finish with hand-set American diamonds. The center motif is surrounded by an elegant halo, making it the most luxurious way to celebrate your bond. Comes in a premium velvet gift box.",
      materials: ["Rose gold plating", "American diamonds", "Velvet ribbon", "Premium alloy"],
      features: ["Diamond-studded", "Rose gold finish", "Luxury gift box", "Heirloom quality"],
      badge: "Luxury", isFeatured: true, image: "rakhi-premium-diamond",
    },
    {
      name: "Antique Temple Bell Rakhi",
      category: "Traditional Rakhi",
      price: 399, compareAtPrice: 549,
      shortDescription: "Traditional temple bell motif in antique finish with brass details.",
      description: "Inspired by ancient temple architecture, the Antique Temple Bell Rakhi features a beautifully detailed bell motif in antique brass finish. The subtle jingle of the bell adds a sacred touch to your Raksha Bandhan celebrations.",
      materials: ["Antique brass", "Cotton thread", "Brass bell"],
      features: ["Antique finish", "Temple bell motif", "Traditional design", "Brass construction"],
      image: "rakhi-traditional-temple",
    },
    {
      name: "Pearl Cascade Lumba for Bhabhi",
      category: "Bhaiya-Bhabhi (Lumba)",
      price: 799, compareAtPrice: 1099,
      shortDescription: "Elegant lumba with cascading pearls for your beloved bhabhi.",
      description: "Show your love and respect for your sister-in-law with the Pearl Cascade Lumba. Featuring a delicate waterfall of freshwater pearls and a golden pendant, this Lumba is designed to be worn as a beautiful bracelet. The elegant design ensures she'll cherish it long after Raksha Bandhan.",
      materials: ["Freshwater pearls", "Golden pendant", "Silk thread", "Brass base"],
      features: ["Cascading pearls", "Bracelet style", "Elegant design", "Premium finish"],
      badge: "For Bhabhi", image: "rakhi-lumba-pearl",
    },
    {
      name: "Roli Chawal Supreme Thali Set",
      category: "Roli-Chawal & Thali",
      price: 349, compareAtPrice: 499,
      shortDescription: "Complete Raksha Bandhan thali with roli, chawal, diya, and sweets placeholder.",
      description: "Complete your Raksha Bandhan ritual with this beautifully curated thali set. Includes premium roli powder, chawal (rice), a decorative diya, and a beautifully designed thali plate. Everything you need for the sacred ceremony, presented in elegant packaging.",
      materials: ["Brass thali", "Roli powder", "Chawal rice", "Decorative diya"],
      features: ["Complete set", "Brass thali", "Includes diya", "Festive packaging"],
      badge: "Festive Set", image: "thali-roli-chawal",
    },
    {
      name: "Pure Silver Roli-Chawal Bowl Set",
      category: "Roli-Chawal & Thali",
      price: 599,
      shortDescription: "Silver-plated roli-chawal bowls with intricate design.",
      description: "Elevate your Raksha Bandhan ceremony with this exquisite silver-plated roli-chawal bowl set. The two small bowls feature intricate traditional designs and come with premium roli and chawal. A beautiful keepsake that will be used year after year.",
      materials: ["Silver-plated brass", "Premium roli", "Chawal rice"],
      features: ["Silver plated", "Set of 2 bowls", "Intricate design", "Premium roli included"],
      badge: "Silver", image: "roli-chawal-bowls",
    },
    {
      name: "Marigold Decorative Thali",
      category: "Roli-Chawal & Thali",
      price: 449,
      shortDescription: "Hand-decorated thali with marigold motifs and complete ritual items.",
      description: "A beautiful hand-decorated thali featuring vibrant marigold motifs, perfect for your Raksha Bandhan ceremony. The thali includes compartments for roli, chawal, diya, and sweets, with everything beautifully arranged for the ritual.",
      materials: ["Decorated steel thali", "Marigold decorations", "Roli, chawal, diya included"],
      features: ["Hand-decorated", "Marigold design", "Complete ritual set", "Reusable thali"],
      image: "thali-marigold",
    },
  ]

  for (const p of products) {
    const slug = slugify(p.name) + "-" + Math.random().toString(36).slice(2, 6)
    const imgPath1 = `/images/${p.image}-1.svg`
    const imgPath2 = `/images/${p.image}-2.svg`
    await db.product.create({
      data: {
        slug,
        name: p.name,
        category: p.category,
        categoryId: catMap[p.category] || null,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        images: JSON.stringify([imgPath1, imgPath2]),
        primaryImage: imgPath1,
        shortDescription: p.shortDescription,
        description: p.description,
        materials: JSON.stringify(p.materials || []),
        features: JSON.stringify(p.features || []),
        badge: p.badge || null,
        inStock: 50,
        isFeatured: p.isFeatured || false,
        sku: generateSKU(),
      },
    })
  }
  console.log("[ensureDB] Products created")

  // 4. Hero slides
  const slides = [
    { title: "The Eternal Bond", subtitle: "RAKHI COLLECTION 2026", description: "Celebrate the sacred thread of love with our handcrafted premium Rakhis. Each piece is a timeless symbol of the unbreakable bond between brother and sister.", image: "/images/hero-1.svg", ctaLabel: "Explore Collection", ctaLink: "shop", order: 0 },
    { title: "Crafted with Devotion", subtitle: "ARTISANAL HERITAGE", description: "From traditional moli to diamond-studded luxury — discover Rakhis that honor centuries of craftsmanship and devotion.", image: "/images/hero-2.svg", ctaLabel: "Shop Premium", ctaLink: "shop", order: 1 },
    { title: "For Bhaiya & Bhabhi", subtitle: "CELEBRATE TOGETHER", description: "Exquisite Lumba sets designed to honor both your brother and sister-in-law. Because some bonds deserve double the celebration.", image: "/images/hero-3.svg", ctaLabel: "View Lumba Sets", ctaLink: "shop", order: 2 },
  ]
  for (const s of slides) {
    await db.heroSlide.create({ data: { ...s, isActive: true } })
  }
  console.log("[ensureDB] Hero slides created")

  // 5. Site content
  const contentSections = [
    { section: "about", data: { title: "About House of Neelam", body: "House of Neelam was born from a simple yet profound belief — that the bond between a brother and sister deserves to be celebrated with beauty, devotion, and craftsmanship that honors centuries of tradition.\n\nEach Rakhi in our collection is handcrafted by skilled artisans who have inherited their craft through generations. From the sacred threads of moli to the intricate Kundan work on our premium pieces, every detail is a testament to love and dedication.\n\nWe curate our collection with the utmost care, ensuring that every Rakhi you choose is not just an accessory, but a sacred symbol of the eternal bond you share with your sibling.", image: "/images/about.svg" } },
    { section: "story", data: {
      title: "The Sacred Bond of Raksha Bandhan",
      titleColor: "#8B1E3E",
      titleFont: "font-serif",
      image: "/images/hero-1.svg",
      image2: "/images/hero-2.svg",
      image3: "/images/hero-3.svg",
      body: "In the heart of every Indian home, there exists a bond that transcends time — the sacred relationship between a brother and sister. Raksha Bandhan celebrates this eternal connection, weaving together threads of love, protection, and devotion.\n\nThe word 'Raksha' means protection, and 'Bandhan' means bond. Together, they form a promise — a sacred vow that has echoed through millennia, from the palaces of ancient kings to the homes of today.\n\n---\n\nLegend speaks of Queen Karnawati of Chittor, who sent a Rakhi to Emperor Humayun in her hour of need. Touched by this sacred thread, the mighty emperor rode to her aid, honoring the bond that knew no boundaries of religion or kingdom.\n\nThrough the ages, this tradition has only grown stronger. Today, when a sister ties the Rakhi on her brother's wrist, she doesn't just tie a thread — she ties a piece of her heart. And when the brother promises to protect her, he doesn't just speak words — he makes a vow that echoes through lifetimes.\n\n---\n\nAt House of Neelam, we understand the weight of this sacred moment. Every Rakhi we craft is not merely an accessory — it is a vessel of love, a symbol of devotion, a thread that binds hearts across distances.\n\nFrom the sacred moli threads blessed by generations of artisans to the diamond-studded luxury pieces that catch the light of a thousand celebrations, each Rakhi tells a story. Your story.\n\nThis Raksha Bandhan, let us help you write the next chapter. Because some bonds are forever — and they deserve to be celebrated with beauty worthy of their depth."
    } },
    { section: "shipping", data: { title: "Shipping & Delivery", body: "We offer free shipping across India on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹49 applies.\n\nAll orders are processed within 1-2 business days and delivered within 3-7 business days depending on your location. You will receive a tracking link via WhatsApp once your order is dispatched.\n\nWe ship across all Indian states and union territories. Cash on Delivery (COD) is available for orders below ₹5,000." } },
    { section: "care", data: { title: "Care Instructions", body: "To preserve the beauty of your Rakhi:\n\n• Store in the provided gift box or a dry, cool place\n• Avoid contact with water, perfume, and chemicals\n• For silver Rakhis, use a soft polishing cloth to maintain shine\n• Gold-plated Rakhis should be kept away from moisture\n• Handmade Rakhis are delicate — handle with care\n\nWith proper care, your Rakhi can be kept as a cherished keepsake for years to come." } },
    { section: "contact", data: { title: "Get in Touch", body: "We'd love to hear from you. Whether you have a question about our Rakhis, need help with an order, or want to discuss a custom design — reach out anytime via WhatsApp or email.", phone: "+919504970435", email: "hello@houseofneelam.com", hours: "Mon - Sat: 10 AM - 7 PM IST" } },
  ]
  for (const c of contentSections) {
    await db.siteContent.create({ data: { section: c.section, data: JSON.stringify(c.data) } })
  }
  console.log("[ensureDB] Site content created")

  // 6. Settings
  const settings = [
    { key: "whatsapp", value: { primaryNumber: "+919504970435", secondaryNumbers: [], brandName: "House of Neelam" } },
    { key: "contact", value: { email: "hello@houseofneelam.com", phone: "+919504970435", address: "India" } },
    { key: "shipping", value: { freeAbove: 999, flatRate: 49, codAvailable: true } },
    { key: "social", value: { instagram: "", facebook: "", youtube: "", pinterest: "" } },
    { key: "announcement", value: { enabled: true, text: "✨ Free shipping across India on orders above ₹999 • Handcrafted with love ✨" } },
    { key: "branding", value: { tagline: "Rakhi Collection", establishedYear: "2024" } },
  ]
  for (const s of settings) {
    await db.siteSetting.create({ data: { key: s.key, value: JSON.stringify(s.value) } })
  }
  console.log("[ensureDB] Settings created")
}
