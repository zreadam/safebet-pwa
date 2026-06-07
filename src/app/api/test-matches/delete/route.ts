import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Authorize only admin
    if (user?.email !== "aziregue633@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { match_id } = body

    if (!match_id) {
      return NextResponse.json({ error: "Missing match_id" }, { status: 400 })
    }

    // Delete the match
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", match_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: "Match supprimé" })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
