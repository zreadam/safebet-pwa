/**
 * Pixel Art Avatars — 16x20 grid, 8px per pixel
 * Chaque joueur est défini comme une grille de couleurs.
 */

const S = 8 // taille d'un pixel

// ── Palette ──────────────────────────────────────────────────
const _ = null           // transparent
const BK = "#1A0A02"     // noir/cheveux très sombres
const BR = "#3D1F08"     // brun moyen (cheveux)
const S1 = "#C8844A"     // peau medium-dark
const S2 = "#8B5A2B"     // peau sombre / ombre
const S3 = "#E0A870"     // peau claire / reflet
const EW = "#FFFFFF"     // blanc de l'œil / dents
const LI = "#7A3018"     // lèvre / bouche
const JB = "#004D98"     // maillot bleu Barça/France
const JR = "#A50044"     // maillot rouge Barça
const JW = "#FFFFFF"     // bande blanche maillot
const JG = "#1B6B2F"     // maillot vert (Brésil)
const JY = "#FFD700"     // maillot jaune (Brésil)
const JN = "#1C2951"     // maillot bleu marine PSG
const JT = "#C8102E"     // maillot rouge (Man City / Arsenal)
const MC = "#6CADDF"     // maillot bleu clair Man City
const WH = "#EEEEEE"     // maillot blanc Real Madrid
const OR = "#FF6600"     // maillot orange Pays-Bas

// ── Grilles joueurs ──────────────────────────────────────────

/** Ronaldinho — peau dark, sourire large, maillot Barça bleu */
const RONALDINHO = [
  [_,_,_,BK,BR,BR,BR,BR,BR,BR,BK,_,_,_,_,_],
  [_,_,BK,BR,BR,BK,BR,BR,BK,BR,BR,BK,_,_,_,_],
  [_,BK,BR,BK,S1,S1,S1,S1,S1,S1,BK,BR,BK,_,_,_],
  [_,BK,S1,S1,S1,S1,S1,S1,S1,S1,S1,BK,BK,_,_,_],
  [_,_,BK,S3,S1,S1,S1,S1,S1,S1,S3,S1,BK,_,_,_],
  [_,_,BK,S1,S1,S1,S1,S1,S1,S1,S1,S1,BK,_,_,_],
  [_,_,_,S1,BK,BK,S1,S1,BK,BK,S1,S1,_,_,_,_],
  [_,_,_,S1,EW,EW,S1,S1,EW,EW,S1,S1,_,_,_,_],
  [_,_,_,S2,EW,BK,S1,S1,BK,EW,S2,S1,_,_,_,_],
  [_,_,_,S1,S1,S1,S1,S1,S1,S1,S1,S1,_,_,_,_],
  [_,_,_,_,S1,S2,S2,S2,S2,S1,_,_,_,_,_,_],
  [_,_,_,_,S1,S1,S1,S1,S1,S1,_,_,_,_,_,_],
  [_,_,_,_,LI,EW,EW,EW,EW,LI,_,_,_,_,_,_],
  [_,_,_,_,_,S2,S1,S1,S2,_,_,_,_,_,_,_],
  [_,_,_,_,JB,JB,S1,S1,JB,JB,_,_,_,_,_,_],
  [_,_,_,JB,JB,JR,JR,JR,JR,JB,JB,_,_,_,_,_],
  [_,_,JB,JB,JR,JR,JR,JR,JR,JR,JB,JB,_,_,_,_],
  [_,JB,JB,JR,JR,JB,JB,JB,JB,JR,JR,JB,JB,_,_,_],
  [JB,JB,JR,JR,JB,JB,JB,JB,JB,JB,JR,JR,JB,JB,_,_],
  [JB,JR,JR,JB,JB,JB,JW,JW,JB,JB,JB,JR,JR,JB,_,_],
]

/** Zidane — crâne rasé, peau claire, maillot bleu France */
const ZIDANE = [
  [_,_,_,BK,BK,BK,BK,BK,BK,BK,BK,_,_,_,_,_],
  [_,_,BK,S2,S2,S2,S2,S2,S2,S2,S2,BK,_,_,_,_],
  [_,BK,S2,S2,S3,S3,S3,S3,S3,S3,S2,S2,BK,_,_,_],
  [_,BK,S3,S3,S3,S3,S3,S3,S3,S3,S3,S3,BK,_,_,_],
  [_,_,BK,S3,S3,S3,S3,S3,S3,S3,S3,S3,BK,_,_,_],
  [_,_,BK,S3,S3,S3,S3,S3,S3,S3,S3,S3,BK,_,_,_],
  [_,_,_,S3,BK,BK,S3,S3,BK,BK,S3,S3,_,_,_,_],
  [_,_,_,S3,EW,EW,S3,S3,EW,EW,S3,S3,_,_,_,_],
  [_,_,_,S2,EW,BK,S3,S3,BK,EW,S2,S3,_,_,_,_],
  [_,_,_,S3,S3,S3,S3,S3,S3,S3,S3,S3,_,_,_,_],
  [_,_,_,_,S3,S2,S2,S2,S2,S3,_,_,_,_,_,_],
  [_,_,_,_,S3,S3,LI,LI,S3,S3,_,_,_,_,_,_],
  [_,_,_,_,S3,LI,S2,S2,LI,S3,_,_,_,_,_,_],
  [_,_,_,_,_,S2,S3,S3,S2,_,_,_,_,_,_,_],
  [_,_,_,_,JB,JB,S3,S3,JB,JB,_,_,_,_,_,_],
  [_,_,_,JB,JB,JB,JW,JW,JB,JB,JB,_,_,_,_,_],
  [_,_,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,_,_,_,_],
  [_,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,_,_,_],
  [JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,JB,_,_],
  [JB,JB,JB,JB,JB,JW,JW,JW,JW,JB,JB,JB,JB,JB,_,_],
]

/** Ronaldo Nazário — coupe R9, maillot Brésil jaune */
const RONALDO_R9 = [
  [_,_,_,BK,BK,BK,BK,BK,BK,BK,BK,_,_,_,_,_],
  [_,_,BK,BR,BR,BR,BK,BK,BR,BR,BR,BK,_,_,_,_],
  [_,BK,BR,BR,S1,S1,S1,S1,S1,S1,BR,BR,BK,_,_,_],
  [_,BK,S1,S1,S1,S1,S1,S1,S1,S1,S1,S1,BK,_,_,_],
  [_,_,BK,S3,S1,S1,S1,S1,S1,S1,S3,S1,BK,_,_,_],
  [_,_,BK,S1,S1,S1,S1,S1,S1,S1,S1,S1,BK,_,_,_],
  [_,_,_,S1,BK,BK,S1,S1,BK,BK,S1,S1,_,_,_,_],
  [_,_,_,S1,EW,EW,S1,S1,EW,EW,S1,S1,_,_,_,_],
  [_,_,_,S2,EW,BK,S1,S1,BK,EW,S2,S1,_,_,_,_],
  [_,_,_,S1,S1,S1,S1,S1,S1,S1,S1,S1,_,_,_,_],
  [_,_,_,_,S1,S2,S2,S2,S2,S1,_,_,_,_,_,_],
  [_,_,_,_,S1,S1,LI,LI,S1,S1,_,_,_,_,_,_],
  [_,_,_,_,LI,EW,EW,EW,EW,LI,_,_,_,_,_,_],
  [_,_,_,_,_,S2,S1,S1,S2,_,_,_,_,_,_,_],
  [_,_,_,_,JY,JY,S1,S1,JY,JY,_,_,_,_,_,_],
  [_,_,_,JG,JY,JY,JY,JY,JY,JY,JG,_,_,_,_,_],
  [_,_,JG,JY,JY,JY,JY,JY,JY,JY,JY,JG,_,_,_,_],
  [_,JG,JY,JY,JY,JG,JG,JG,JG,JY,JY,JG,JG,_,_,_],
  [JG,JY,JY,JG,JY,JY,JY,JY,JY,JY,JG,JY,JG,JG,_,_],
  [JG,JY,JG,JY,JY,JY,JY,JY,JY,JY,JY,JG,JY,JG,_,_],
]

/** Mbappé — peau sombre, maillot Real Madrid blanc */
const MBAPPE = [
  [_,_,_,BK,BK,BK,BK,BK,BK,BK,BK,_,_,_,_,_],
  [_,_,BK,BK,BK,BK,BK,BK,BK,BK,BK,BK,_,_,_,_],
  [_,BK,BK,BK,S2,S2,S2,S2,S2,S2,BK,BK,BK,_,_,_],
  [_,BK,S2,S2,S2,S2,S2,S2,S2,S2,S2,S2,BK,_,_,_],
  [_,_,BK,S1,S2,S2,S2,S2,S2,S2,S1,S2,BK,_,_,_],
  [_,_,BK,S2,S2,S2,S2,S2,S2,S2,S2,S2,BK,_,_,_],
  [_,_,_,S2,BK,BK,S2,S2,BK,BK,S2,S2,_,_,_,_],
  [_,_,_,S2,EW,EW,S2,S2,EW,EW,S2,S2,_,_,_,_],
  [_,_,_,S2,EW,BK,S2,S2,BK,EW,S2,S2,_,_,_,_],
  [_,_,_,S2,S2,S2,S2,S2,S2,S2,S2,S2,_,_,_,_],
  [_,_,_,_,S2,S2,S2,S2,S2,S2,_,_,_,_,_,_],
  [_,_,_,_,S2,S2,LI,LI,S2,S2,_,_,_,_,_,_],
  [_,_,_,_,S2,LI,S2,S2,LI,S2,_,_,_,_,_,_],
  [_,_,_,_,_,S2,S2,S2,S2,_,_,_,_,_,_,_],
  [_,_,_,_,WH,WH,S2,S2,WH,WH,_,_,_,_,_,_],
  [_,_,_,WH,WH,WH,WH,WH,WH,WH,WH,_,_,_,_,_],
  [_,_,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,_,_,_,_],
  [_,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,_,_,_],
  [WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,_,_],
  [WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,WH,_,_],
]

/** Haaland — peau claire, blond, maillot Man City */
const HAALAND = [
  [_,_,_,JY,JY,JY,JY,JY,JY,JY,JY,_,_,_,_,_],
  [_,_,JY,JY,JY,JY,JY,JY,JY,JY,JY,JY,_,_,_,_],
  [_,JY,JY,JY,S3,S3,S3,S3,S3,S3,JY,JY,JY,_,_,_],
  [_,JY,S3,S3,S3,S3,S3,S3,S3,S3,S3,S3,JY,_,_,_],
  [_,_,JY,S3,S3,S3,S3,S3,S3,S3,S3,S3,JY,_,_,_],
  [_,_,JY,S3,S3,S3,S3,S3,S3,S3,S3,S3,JY,_,_,_],
  [_,_,_,S3,BK,BK,S3,S3,BK,BK,S3,S3,_,_,_,_],
  [_,_,_,S3,EW,EW,S3,S3,EW,EW,S3,S3,_,_,_,_],
  [_,_,_,S3,EW,BK,S3,S3,BK,EW,S3,S3,_,_,_,_],
  [_,_,_,S3,S3,S3,S3,S3,S3,S3,S3,S3,_,_,_,_],
  [_,_,_,_,S3,S3,S2,S2,S3,S3,_,_,_,_,_,_],
  [_,_,_,_,S3,S3,S3,S3,S3,S3,_,_,_,_,_,_],
  [_,_,_,_,S3,LI,S3,S3,LI,S3,_,_,_,_,_,_],
  [_,_,_,_,_,S3,S3,S3,S3,_,_,_,_,_,_,_],
  [_,_,_,_,MC,MC,S3,S3,MC,MC,_,_,_,_,_,_],
  [_,_,_,MC,MC,MC,EW,EW,MC,MC,MC,_,_,_,_,_],
  [_,_,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,_,_,_,_],
  [_,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,_,_,_],
  [MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,_,_],
  [MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,MC,_,_],
]

// ── Map des grilles ───────────────────────────────────────────
const GRIDS: Record<string, (string | null)[][]> = {
  ronaldinho: RONALDINHO,
  zidane:     ZIDANE,
  r9:         RONALDO_R9,
  mbappe:     MBAPPE,
  haaland:    HAALAND,
}

// ── Composant ────────────────────────────────────────────────
interface PixelAvatarProps {
  player: keyof typeof GRIDS
  size?: number
}

export function PixelAvatar({ player, size = 64 }: PixelAvatarProps) {
  const grid = GRIDS[player] ?? RONALDINHO
  const rows = grid.length
  const cols = grid[0].length
  const px = S  // taille native d'un pixel dans le SVG

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cols * px} ${rows * px}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {grid.flatMap((row, y) =>
        row.map((color, x) =>
          color ? (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  )
}

export const PIXEL_AVATAR_KEYS = Object.keys(GRIDS) as (keyof typeof GRIDS)[]
