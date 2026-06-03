import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Exclure : assets statiques, API routes (gèrent leur propre auth), et fichiers PWA
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
