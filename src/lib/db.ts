import { createClient, type Client } from '@libsql/client'

// Direct libsql client — works reliably on Vercel + Turso
// This bypasses Prisma entirely for database operations

export type DbClient = Client

let _client: Client | null = null

export function getLibsqlClient(): Client {
  if (_client) return _client

  const databaseUrl = process.env.DATABASE_URL
  const isVercel = process.env.VERCEL === '1'

  if (isVercel && (!databaseUrl || databaseUrl.startsWith('file:'))) {
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  DATABASE NOT CONFIGURED FOR PRODUCTION                           ║
║                                                                   ║
║  On Vercel/production, you MUST set these env vars:               ║
║  - DATABASE_URL        (libsql://... from Turso)                  ║
║  - DATABASE_AUTH_TOKEN  (Turso auth token)                        ║
║                                                                   ║
║  Sign up free at https://turso.tech                               ║
╚══════════════════════════════════════════════════════════════════╝
`)
  }

  const url = databaseUrl || 'file:./db/custom.db'

  console.log('[db] Creating libsql client, URL prefix:', url.slice(0, 25) + '...')

  _client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  return _client
}

// Helper to generate CUID-like IDs
export function generateId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// Helper to generate slugs
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Helper to generate SKUs
export function generateSKU(prefix: string = 'RKH'): string {
  const rand = Math.floor(1000 + Math.random() * 9000)
  const ts = Date.now().toString().slice(-4)
  return `${prefix}-${rand}${ts}`
}

// Helper to generate order numbers
export function generateOrderNumber(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `HON-${y}${m}${d}-${rand}`
}

// Format INR
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Parse JSON safely
export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// ─── Database Access Layer ───────────────────────────────────────────────────
// Simple query wrappers that mimic Prisma's API but use libsql directly

export const db = {
  // ─── Users ─────────────────────────────────────────────────────────────
  user: {
    async count(opts?: { where?: { role?: string; email?: string } }) {
      const client = getLibsqlClient()
      if (opts?.where?.role) {
        const result = await client.execute({ sql: 'SELECT COUNT(*) as count FROM User WHERE role = ?', args: [opts.where.role] })
        return Number((result.rows[0] as any)?.count || 0)
      }
      if (opts?.where?.email) {
        const result = await client.execute({ sql: 'SELECT COUNT(*) as count FROM User WHERE email = ?', args: [opts.where.email] })
        return Number((result.rows[0] as any)?.count || 0)
      }
      const result = await client.execute('SELECT COUNT(*) as count FROM User')
      return Number((result.rows[0] as any)?.count || 0)
    },
    async findUnique(opts: { where: { email: string } }) {
      const client = getLibsqlClient()
      const result = await client.execute({ sql: 'SELECT * FROM User WHERE email = ?', args: [opts.where.email] })
      return (result.rows[0] as any) || null
    },
    async create(opts: { data: any }) {
      const client = getLibsqlClient()
      const id = opts.data.id || generateId()
      const now = new Date().toISOString()
      await client.execute({
        sql: `INSERT INTO User (id, email, name, passwordHash, role, phone, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          opts.data.email,
          opts.data.name || null,
          opts.data.passwordHash || null,
          opts.data.role || 'ADMIN',
          opts.data.phone || null,
          now,
          now,
        ],
      })
      return { id, ...opts.data, createdAt: now, updatedAt: now }
    },
  },

  // ─── Categories ────────────────────────────────────────────────────────
  category: {
    async count() {
      const client = getLibsqlClient()
      const result = await client.execute('SELECT COUNT(*) as count FROM Category')
      return Number((result.rows[0] as any)?.count || 0)
    },
    async findMany(opts?: { where?: { isActive?: boolean }; orderBy?: { order?: 'asc' | 'desc' }; include?: { products?: boolean } }) {
      const client = getLibsqlClient()
      const where = opts?.where?.isActive !== undefined ? `WHERE isActive = ${opts.where.isActive ? 1 : 0}` : ''
      const order = opts?.orderBy?.order === 'desc' ? 'DESC' : 'ASC'
      const result = await client.execute(`SELECT * FROM Category ${where} ORDER BY \`order\` ${order}`)
      let categories = result.rows as any[]

      if (opts?.include?.products) {
        for (const cat of categories) {
          const prods = await client.execute({
            sql: 'SELECT id FROM Product WHERE categoryId = ? AND isActive = 1',
            args: [cat.id],
          })
          cat.products = prods.rows
          cat.productCount = prods.rows.length
        }
      }
      return categories
    },
    async create(opts: { data: any }) {
      const client = getLibsqlClient()
      const id = opts.data.id || generateId()
      const now = new Date().toISOString()
      await client.execute({
        sql: `INSERT INTO Category (id, name, slug, description, image, imageMobile, icon, \`order\`, isActive, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          opts.data.name,
          opts.data.slug,
          opts.data.description || null,
          opts.data.image || null,
          opts.data.imageMobile || null,
          opts.data.icon || null,
          opts.data.order || 0,
          opts.data.isActive !== false ? 1 : 0,
          now,
          now,
        ],
      })
      return { id, ...opts.data, createdAt: now, updatedAt: now }
    },
    async update(opts: { where: { id: string }; data: any }) {
      const client = getLibsqlClient()
      const now = new Date().toISOString()
      const fields: string[] = []
      const args: any[] = []
      for (const [k, v] of Object.entries(opts.data)) {
        if (k === 'order') {
          fields.push('`order` = ?')
          args.push(v)
        } else if (k === 'isActive') {
          fields.push('isActive = ?')
          args.push(v ? 1 : 0)
        } else {
          fields.push(`${k} = ?`)
          args.push(v)
        }
      }
      fields.push('updatedAt = ?')
      args.push(now)
      args.push(opts.where.id)
      await client.execute({
        sql: `UPDATE Category SET ${fields.join(', ')} WHERE id = ?`,
        args,
      })
      return { id: opts.where.id, ...opts.data, updatedAt: now }
    },
    async delete(opts: { where: { id: string } }) {
      const client = getLibsqlClient()
      await client.execute({ sql: 'DELETE FROM Category WHERE id = ?', args: [opts.where.id] })
      return { success: true }
    },
  },

  // ─── Products ──────────────────────────────────────────────────────────
  product: {
    async count() {
      const client = getLibsqlClient()
      const result = await client.execute('SELECT COUNT(*) as count FROM Product')
      return Number((result.rows[0] as any)?.count || 0)
    },
    async findMany(opts?: { where?: any; orderBy?: any; take?: number; include?: any }) {
      const client = getLibsqlClient()
      let sql = 'SELECT * FROM Product'
      const args: any[] = []
      const conditions: string[] = []

      if (opts?.where) {
        if (opts.where.isActive !== undefined) {
          conditions.push('isActive = ?')
          args.push(opts.where.isActive ? 1 : 0)
        }
        if (opts.where.category) {
          conditions.push('category = ?')
          args.push(opts.where.category)
        }
        if (opts.where.isFeatured !== undefined) {
          conditions.push('isFeatured = ?')
          args.push(opts.where.isFeatured ? 1 : 0)
        }
        if (opts.where.OR) {
          const orConditions: string[] = []
          for (const cond of opts.where.OR) {
            for (const [k, v] of Object.entries(cond)) {
              orConditions.push(`${k} LIKE ?`)
              args.push(`%${v}%`)
            }
          }
          if (orConditions.length) {
            conditions.push(`(${orConditions.join(' OR ')})`)
          }
        }
      }

      if (conditions.length) {
        sql += ' WHERE ' + conditions.join(' AND ')
      }

      sql += ' ORDER BY createdAt DESC'

      if (opts?.take) {
        sql += ` LIMIT ${opts.take}`
      }

      const result = await client.execute({ sql, args })
      return result.rows as any[]
    },
    async findUnique(opts: { where: { slug: string }; include?: any }) {
      const client = getLibsqlClient()
      const result = await client.execute({ sql: 'SELECT * FROM Product WHERE slug = ?', args: [opts.where.slug] })
      return (result.rows[0] as any) || null
    },
    async create(opts: { data: any }) {
      const client = getLibsqlClient()
      const id = opts.data.id || generateId()
      const now = new Date().toISOString()
      await client.execute({
        sql: `INSERT INTO Product (id, slug, name, category, categoryId, price, compareAtPrice, images, primaryImage,
              primaryImageMobile, imagesMobile,
              shortDescription, description, materials, features, sku, badge, inStock, isActive, isFeatured,
              rating, reviewCount, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          opts.data.slug,
          opts.data.name,
          opts.data.category,
          opts.data.categoryId || null,
          opts.data.price,
          opts.data.compareAtPrice || null,
          opts.data.images,
          opts.data.primaryImage,
          opts.data.primaryImageMobile || null,
          opts.data.imagesMobile || null,
          opts.data.shortDescription,
          opts.data.description,
          opts.data.materials,
          opts.data.features,
          opts.data.sku,
          opts.data.badge || null,
          opts.data.inStock || 50,
          opts.data.isActive !== false ? 1 : 0,
          opts.data.isFeatured ? 1 : 0,
          opts.data.rating || 5.0,
          opts.data.reviewCount || 0,
          now,
          now,
        ],
      })
      return { id, ...opts.data, createdAt: now, updatedAt: now }
    },
    async update(opts: { where: { id: string }; data: any }) {
      const client = getLibsqlClient()
      const now = new Date().toISOString()
      const fields: string[] = []
      const args: any[] = []
      for (const [k, v] of Object.entries(opts.data)) {
        if (k === 'isActive' || k === 'isFeatured') {
          fields.push(`${k} = ?`)
          args.push(v ? 1 : 0)
        } else if (k === 'images' || k === 'materials' || k === 'features' || k === 'imagesMobile') {
          fields.push(`${k} = ?`)
          args.push(typeof v === 'string' ? v : JSON.stringify(v))
          if (k === 'images' && Array.isArray(v)) {
            fields.push('primaryImage = ?')
            args.push(v[0] || '')
          }
          if (k === 'imagesMobile' && Array.isArray(v)) {
            fields.push('primaryImageMobile = ?')
            args.push(v[0] || '')
          }
        } else if (['price', 'compareAtPrice', 'inStock'].includes(k)) {
          fields.push(`${k} = ?`)
          args.push(v === null ? null : Number(v))
        } else {
          fields.push(`${k} = ?`)
          args.push(v)
        }
      }
      fields.push('updatedAt = ?')
      args.push(now)
      args.push(opts.where.id)
      await client.execute({
        sql: `UPDATE Product SET ${fields.join(', ')} WHERE id = ?`,
        args,
      })
      return { id: opts.where.id, ...opts.data, updatedAt: now }
    },
    async delete(opts: { where: { id: string } }) {
      const client = getLibsqlClient()
      await client.execute({ sql: 'DELETE FROM Product WHERE id = ?', args: [opts.where.id] })
      return { success: true }
    },
  },

  // ─── Hero Slides ───────────────────────────────────────────────────────
  heroSlide: {
    async count() {
      const client = getLibsqlClient()
      const result = await client.execute('SELECT COUNT(*) as count FROM HeroSlide')
      return Number((result.rows[0] as any)?.count || 0)
    },
    async findMany(opts?: { where?: { isActive?: boolean }; orderBy?: any }) {
      const client = getLibsqlClient()
      const where = opts?.where?.isActive !== undefined ? `WHERE isActive = ${opts.where.isActive ? 1 : 0}` : ''
      const result = await client.execute(`SELECT * FROM HeroSlide ${where} ORDER BY \`order\` ASC`)
      return result.rows as any[]
    },
    async create(opts: { data: any }) {
      const client = getLibsqlClient()
      const id = opts.data.id || generateId()
      const now = new Date().toISOString()
      await client.execute({
        sql: `INSERT INTO HeroSlide (id, title, subtitle, description, image, imageMobile, ctaLabel, ctaLink, \`order\`, isActive, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          opts.data.title,
          opts.data.subtitle,
          opts.data.description || null,
          opts.data.image,
          opts.data.imageMobile || null,
          opts.data.ctaLabel || null,
          opts.data.ctaLink || null,
          opts.data.order || 0,
          opts.data.isActive !== false ? 1 : 0,
          now,
          now,
        ],
      })
      return { id, ...opts.data, createdAt: now, updatedAt: now }
    },
    async update(opts: { where: { id: string }; data: any }) {
      const client = getLibsqlClient()
      const now = new Date().toISOString()
      const fields: string[] = []
      const args: any[] = []
      for (const [k, v] of Object.entries(opts.data)) {
        if (k === 'order') {
          fields.push('`order` = ?')
          args.push(v)
        } else if (k === 'isActive') {
          fields.push('isActive = ?')
          args.push(v ? 1 : 0)
        } else {
          fields.push(`${k} = ?`)
          args.push(v)
        }
      }
      fields.push('updatedAt = ?')
      args.push(now)
      args.push(opts.where.id)
      await client.execute({
        sql: `UPDATE HeroSlide SET ${fields.join(', ')} WHERE id = ?`,
        args,
      })
      return { id: opts.where.id, ...opts.data, updatedAt: now }
    },
    async delete(opts: { where: { id: string } }) {
      const client = getLibsqlClient()
      await client.execute({ sql: 'DELETE FROM HeroSlide WHERE id = ?', args: [opts.where.id] })
      return { success: true }
    },
  },

  // ─── Site Settings ─────────────────────────────────────────────────────
  siteSetting: {
    async findMany() {
      const client = getLibsqlClient()
      const result = await client.execute('SELECT * FROM SiteSetting')
      return result.rows as any[]
    },
    async findUnique(opts: { where: { key: string } }) {
      const client = getLibsqlClient()
      const result = await client.execute({ sql: 'SELECT * FROM SiteSetting WHERE key = ?', args: [opts.where.key] })
      return (result.rows[0] as any) || null
    },
    async create(opts: { data: any }) {
      const client = getLibsqlClient()
      const id = generateId()
      const value = typeof opts.data.value === 'string' ? opts.data.value : JSON.stringify(opts.data.value)
      await client.execute({ sql: 'INSERT INTO SiteSetting (id, key, value) VALUES (?, ?, ?)', args: [id, opts.data.key, value] })
      return { id, ...opts.data, value }
    },
    async upsert(opts: { where: { key: string }; create: any; update: any }) {
      const client = getLibsqlClient()
      const existing = await client.execute({ sql: 'SELECT id FROM SiteSetting WHERE key = ?', args: [opts.where.key] })
      const value = opts.update.value || opts.create.value
      if (existing.rows.length > 0) {
        await client.execute({ sql: 'UPDATE SiteSetting SET value = ? WHERE key = ?', args: [value, opts.where.key] })
      } else {
        const id = generateId()
        await client.execute({ sql: 'INSERT INTO SiteSetting (id, key, value) VALUES (?, ?, ?)', args: [id, opts.where.key, value] })
      }
      return { key: opts.where.key, value }
    },
  },

  // ─── Site Content ──────────────────────────────────────────────────────
  siteContent: {
    async findMany() {
      const client = getLibsqlClient()
      const result = await client.execute('SELECT * FROM SiteContent')
      return result.rows as any[]
    },
    async findUnique(opts: { where: { section: string } }) {
      const client = getLibsqlClient()
      const result = await client.execute({ sql: 'SELECT * FROM SiteContent WHERE section = ?', args: [opts.where.section] })
      return (result.rows[0] as any) || null
    },
    async create(opts: { data: any }) {
      const client = getLibsqlClient()
      const id = generateId()
      const now = new Date().toISOString()
      const data = typeof opts.data.data === 'string' ? opts.data.data : JSON.stringify(opts.data.data)
      await client.execute({ sql: 'INSERT INTO SiteContent (id, section, data, updatedAt, createdAt) VALUES (?, ?, ?, ?, ?)', args: [id, opts.data.section, data, now, now] })
      return { id, ...opts.data, data, createdAt: now, updatedAt: now }
    },
    async upsert(opts: { where: { section: string }; create: any; update: any }) {
      const client = getLibsqlClient()
      const existing = await client.execute({ sql: 'SELECT id FROM SiteContent WHERE section = ?', args: [opts.where.section] })
      const data = opts.update.data || opts.create.data
      const now = new Date().toISOString()
      if (existing.rows.length > 0) {
        await client.execute({ sql: 'UPDATE SiteContent SET data = ?, updatedAt = ? WHERE section = ?', args: [data, now, opts.where.section] })
      } else {
        const id = generateId()
        await client.execute({ sql: 'INSERT INTO SiteContent (id, section, data, updatedAt, createdAt) VALUES (?, ?, ?, ?, ?)', args: [id, opts.where.section, data, now, now] })
      }
      return { section: opts.where.section, data }
    },
  },

  // ─── Orders ────────────────────────────────────────────────────────────
  order: {
    async count() {
      const client = getLibsqlClient()
      const result = await client.execute('SELECT COUNT(*) as count FROM `Order`')
      return Number((result.rows[0] as any)?.count || 0)
    },
    async findMany(opts?: { orderBy?: any; include?: any; take?: number }) {
      const client = getLibsqlClient()
      let sql = 'SELECT * FROM `Order` ORDER BY createdAt DESC'
      if (opts?.take) sql += ` LIMIT ${opts.take}`
      const result = await client.execute(sql)
      const orders = result.rows as any[]

      if (opts?.include?.items) {
        for (const order of orders) {
          const itemsResult = await client.execute({ sql: 'SELECT * FROM OrderItem WHERE orderId = ?', args: [order.id] })
          order.items = itemsResult.rows
        }
      }
      return orders
    },
    async create(opts: { data: any; include?: any }) {
      const client = getLibsqlClient()
      const id = opts.data.id || generateId()
      const now = new Date().toISOString()
      await client.execute({
        sql: `INSERT INTO \`Order\` (id, orderNumber, userId, customerName, customerPhone, customerEmail,
              customerAddress, customerCity, customerState, customerPincode, customerNotes,
              subtotal, shipping, total, status, whatsappSentAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          opts.data.orderNumber,
          opts.data.userId || null,
          opts.data.customerName,
          opts.data.customerPhone,
          opts.data.customerEmail || null,
          opts.data.customerAddress || null,
          opts.data.customerCity || null,
          opts.data.customerState || null,
          opts.data.customerPincode || null,
          opts.data.customerNotes || null,
          opts.data.subtotal,
          opts.data.shipping || 0,
          opts.data.total,
          opts.data.status || 'PENDING',
          opts.data.whatsappSentAt ? new Date(opts.data.whatsappSentAt).toISOString() : now,
          now,
          now,
        ],
      })

      // Create order items
      if (opts.data.items?.create) {
        for (const item of opts.data.items.create) {
          const itemId = generateId()
          await client.execute({
            sql: `INSERT INTO OrderItem (id, orderId, productId, name, image, price, quantity)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              itemId,
              id,
              item.productId || null,
              item.name,
              item.image,
              item.price,
              item.quantity,
            ],
          })
        }
      }

      const result: any = { id, ...opts.data, createdAt: now, updatedAt: now }
      if (opts.include?.items) {
        const itemsResult = await client.execute({ sql: 'SELECT * FROM OrderItem WHERE orderId = ?', args: [id] })
        result.items = itemsResult.rows
      }
      return result
    },
    async update(opts: { where: { id: string }; data: any; include?: any }) {
      const client = getLibsqlClient()
      const now = new Date().toISOString()
      const fields: string[] = []
      const args: any[] = []
      for (const [k, v] of Object.entries(opts.data)) {
        fields.push(`${k} = ?`)
        args.push(v)
      }
      fields.push('updatedAt = ?')
      args.push(now)
      args.push(opts.where.id)
      await client.execute({
        sql: `UPDATE \`Order\` SET ${fields.join(', ')} WHERE id = ?`,
        args,
      })
      const result: any = { id: opts.where.id, ...opts.data, updatedAt: now }
      if (opts.include?.items) {
        const itemsResult = await client.execute({ sql: 'SELECT * FROM OrderItem WHERE orderId = ?', args: [opts.where.id] })
        result.items = itemsResult.rows
      }
      return result
    },
    async delete(opts: { where: { id: string } }) {
      const client = getLibsqlClient()
      await client.execute({ sql: 'DELETE FROM OrderItem WHERE orderId = ?', args: [opts.where.id] })
      await client.execute({ sql: 'DELETE FROM `Order` WHERE id = ?', args: [opts.where.id] })
      return { success: true }
    },
  },

  // ─── Raw SQL execution (for table creation) ────────────────────────────
  async $executeRawUnsafe(sql: string) {
    const client = getLibsqlClient()
    await client.execute(sql)
  },
}
