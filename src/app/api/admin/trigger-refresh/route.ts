/**
 * Admin endpoint — déclenche refresh-matches
 * À SUPPRIMER après test !
 */

import { NextResponse } from "next/server"
import { GET as refreshMatches } from "../../cron/refresh-matches/route"

export async function GET(req: Request) {
  // Créer une request fake avec la bonne clé
  const CRON_SECRET = process.env.CRON_SECRET || "demo"

  const fakeReq = new Request(req.url, {
    method: "GET",
    headers: {
      "authorization": `Bearer ${CRON_SECRET}`,
    },
  })

  return refreshMatches(fakeReq)
}
