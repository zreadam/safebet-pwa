"use client"

import { PixelAvatar, PIXEL_AVATAR_KEYS } from "@/components/ui/avatars/PixelAvatar"

const LABELS: Record<string, string> = {
  ronaldinho: "Ronaldinho",
  zidane:     "Zidane",
  r9:         "Ronaldo R9",
  mbappe:     "Mbappé",
  haaland:    "Haaland",
}

export default function AvatarsPreview() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center py-12 px-6 gap-10">
      <h1 className="text-white text-2xl font-bold">Pixel Art Avatars — Prévisualisation</h1>

      {/* Grande taille */}
      <section className="w-full max-w-lg">
        <p className="text-white/60 text-sm mb-4">Taille 128×128</p>
        <div className="flex flex-wrap gap-6 justify-center">
          {PIXEL_AVATAR_KEYS.map(key => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="rounded-2xl overflow-hidden border-2 border-white/10">
                <PixelAvatar player={key} size={128} />
              </div>
              <span className="text-white/70 text-xs">{LABELS[key]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Taille avatar profil */}
      <section className="w-full max-w-lg">
        <p className="text-white/60 text-sm mb-4">Taille profil (64×64)</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {PIXEL_AVATAR_KEYS.map(key => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10">
                <PixelAvatar player={key} size={64} />
              </div>
              <span className="text-white/70 text-xs">{LABELS[key]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Taille mini (classement) */}
      <section className="w-full max-w-lg">
        <p className="text-white/60 text-sm mb-4">Taille mini classement (36×36)</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {PIXEL_AVATAR_KEYS.map(key => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10">
                <PixelAvatar player={key} size={36} />
              </div>
              <span className="text-white/50 text-[10px]">{LABELS[key]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
