import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return null
  }
  return session
}
