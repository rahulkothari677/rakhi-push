import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db, getLibsqlClient, generateId } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please login instead." }, { status: 400 })
    }

    // Create customer account
    const passwordHash = await bcrypt.hash(password, 10)
    const id = generateId()
    const now = new Date().toISOString()

    const client = getLibsqlClient()
    await client.execute({
      sql: `INSERT INTO "User" (id, email, name, passwordHash, role, phone, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, email.toLowerCase(), name || null, passwordHash, "CUSTOMER", phone || null, now, now],
    })

    return NextResponse.json({
      success: true,
      message: "Account created successfully! You can now login.",
      user: { id, email: email.toLowerCase(), name, role: "CUSTOMER" },
    })
  } catch (e: any) {
    console.error("Signup error:", e)
    return NextResponse.json({ error: e.message || "Signup failed" }, { status: 500 })
  }
}
