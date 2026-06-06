"use client"

import { useState } from "react"
import { toast } from "sonner"

export default function AdminPage() {
  const [loading, setLoading] = useState(false)

  async function createDemoMatches() {
    setLoading(true)
    try {
      const res = await fetch("/api/matches/create-demo", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        toast.success(`✅ ${data.inserted} matchs créés avec succès!`)
      } else {
        toast.error(data.error || "Erreur lors de la création des matchs")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-1)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-[var(--fg-1)] mb-2">Admin Panel</h1>
        <p className="text-[var(--fg-3)] mb-8">Outils de développement et test</p>

        <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6 space-y-6">
          {/* Demo Matches */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--fg-1)] mb-2">📋 Matchs de Démo</h2>
              <p className="text-[var(--fg-3)] text-sm mb-4">
                Crée 5 matchs de démonstration avec des cotes réalistes pour tester l'application
              </p>
            </div>

            <button
              onClick={createDemoMatches}
              disabled={loading}
              className="w-full bg-[var(--emerald-500)] hover:bg-[var(--emerald-600)] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors active:scale-95"
            >
              {loading ? "Création en cours..." : "🎮 Créer des matchs de démo"}
            </button>

            <div className="bg-[var(--bg-1)] rounded p-4 text-sm text-[var(--fg-3)]">
              <p className="font-semibold text-[var(--fg-2)] mb-2">Matchs qui seront créés:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>🌍 Coupe du Monde (France vs Espagne)</li>
                <li>🏆 Ligue des Champions (Manchester City vs Real Madrid)</li>
                <li>🔴 Europa League (AS Roma vs Olympique Lyonnais)</li>
                <li>🟢 Conference League (Fiorentina vs Genoa)</li>
                <li>🇩🇪 Bundesliga (Bayern Munich vs Borussia Dortmund)</li>
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t border-[var(--border-light)] pt-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--fg-1)] mb-2">📖 Instructions</h2>
              <ol className="space-y-2 text-sm text-[var(--fg-3)]">
                <li><span className="font-semibold">1.</span> Cliquez sur "Créer des matchs de démo"</li>
                <li><span className="font-semibold">2.</span> Allez sur la page <a href="/paris" className="text-[var(--emerald-500)] hover:underline">/paris</a></li>
                <li><span className="font-semibold">3.</span> Les matchs apparaîtront dans la liste</li>
                <li><span className="font-semibold">4.</span> Cliquez sur les cotes pour ajouter au panier</li>
                <li><span className="font-semibold">5.</span> Placez vos paris!</li>
              </ol>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              ℹ️ Les matchs de démo apparaîtront immédiatement sur <a href="/paris" className="font-bold text-blue-700 hover:underline">/paris</a> avec les fonds de compétition appropriés et les cotes réalistes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
