import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const BUCKET = "avatars"

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  // Parse le fichier
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 })

  // Vérif taille (2 MB max) et type
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "Fichier trop volumineux (max 2 Mo)" }, { status: 400 })
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Seules les images sont acceptées" }, { status: 400 })

  // Client admin pour storage (service role)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Créer le bucket s'il n'existe pas encore
  const { data: buckets } = await admin.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET)
  if (!bucketExists) {
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 2097152 })
  }

  // Convertir en buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Chemin : avatars/{userId}.{ext}
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${user.id}.${ext}`

  // Upload (upsert)
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // URL publique
  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}` // cache-bust

  // Sauvegarder dans profiles
  await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  return NextResponse.json({ url: publicUrl })
}
