import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "./db"
import { ensureDB } from "./ensure-db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // Ensure DB is initialized before querying
        try {
          await ensureDB()
        } catch (e) {
          console.error("[auth] DB init failed:", e)
          return null
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user || !user.passwordHash) return null
        if (user.role !== "ADMIN" && user.role !== "CUSTOMER") return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          userRole: user.role,
        } as any
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "house-of-neelam-rakhi-secret-2026",
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, attach user info to token using a non-conflicting key
      if (user) {
        // @ts-ignore
        token.userRole = (user as any).userRole
        // @ts-ignore
        token.userId = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      // Forward token data to session.user
      if (session.user) {
        // @ts-ignore
        ;(session.user as any).role = (token as any).userRole
        // @ts-ignore
        ;(session.user as any).id = (token as any).userId
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
}
