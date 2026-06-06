import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = "https://safebet-pwa.vercel.app"
  const cronSecret = process.env.CRON_SECRET || "YOUR_CRON_SECRET"

  const setupInstructions = {
    service: "EasyCron (Gratuit & Sans Limite)",
    instructions: [
      "1. Va sur https://easycron.com (gratuit, pas de carte de crédit requise)",
      "2. Clique sur 'Create Cron Job'",
      "3. Crée 2 cron jobs :",
    ],
    cronJobs: [
      {
        name: "Live Events Notifications",
        url: `${baseUrl}/api/cron/live-events?secret=${cronSecret}`,
        frequency: "Toutes les 5 minutes (*/5 * * * *)",
        description: "Envoie des notifications pour les buts, cartons, remplacements, match terminé",
      },
      {
        name: "Bet Settlement Notifications",
        url: `${baseUrl}/api/cron/settle-bets?secret=${cronSecret}`,
        frequency: "Toutes les 5 minutes (*/5 * * * *)",
        description: "Envoie des notifications quand un pari est gagné/perdu/annulé",
      },
    ],
    summary: `
Une fois configurés, les cron jobs vont :
✅ Envoyer des notifications en temps réel pour les événements live
✅ Informer les utilisateurs des résultats de leurs paris
✅ Envoyer des rappels 15 min avant les matchs

Le système est maintenant COMPLÈTEMENT AUTOMATISÉ ! 🚀
    `,
  }

  return NextResponse.json(setupInstructions)
}
