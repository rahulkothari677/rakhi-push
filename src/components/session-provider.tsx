"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { authOptions } from "@/lib/auth"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
