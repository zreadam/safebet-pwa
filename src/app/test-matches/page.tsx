"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TEAMS = [
  "PSG", "Olympique Lyonnais", "Marseille", "Monaco", "Lille",
  "Manchester United", "Manchester City", "Liverpool", "Arsenal", "Chelsea",
  "Real Madrid", "Barcelona", "Atletico Madrid", "Valencia", "Sevilla",
  "Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig", "Union Berlin",
  "Juventus", "Inter Milan", "AC Milan", "AS Rome", "Napoli",
]

const COMPETITIONS = [
  { key: "L1", name: "Ligue 1", color: "#4F46E5" },
  { key: "PL", name: "Premier League", color: "#3B82F6" },
  { key: "LIGA", name: "La Liga", color: "#EF4444" },
  { key: "BL", name: "Bundesliga", color: "#F59E0B" },
  { key: "SA", name: "Serie A", color: "#8B5CF6" },
]

interface TestMatch {
  id: string
  home_team: string
  away_team: string
  competition: string
  competition_name: string
  odds_1: number
  odds_n: number
  odds_2: number
  state: "soon" | "live" | "done"
  kickoff: string
  home_score?: number
  away_score?: number
}

export default function TestMatchesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  // Form state
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [competition, setCompetition] = useState("L1")
  const [odds1, setOdds1] = useState(2.15)
  const [oddsN, setOddsN] = useState(3.45)
  const [odds2, setOdds2] = useState(3.20)

  const [testMatches, setTestMatches] = useState<TestMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<TestMatch | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [stats, setStats] = useState({
    homePossession: 50,
    homeShots: 10,
    homeShotsOnTarget: 5,
    homeCorners: 5,
    homeYellowCards: 2,
    homeRedCards: 0,
    awayPossession: 50,
    awayShots: 10,
    awayShotsOnTarget: 5,
    awayCorners: 5,
    awayYellowCards: 2,
    awayRedCards: 0,
  })

  const [creating, setCreating] = useState(false)
  const [simulating, setSimulating] = useState(false)

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user?.email === "aziregue633@gmail.com") {
        setAuthorized(true)
        await fetchTestMatches()
      } else if (user?.email) {
        toast.error("Accès non autorisé")
        router.push("/")
      }

      setLoading(false)
    }
    checkAuth()
  }, [supabase, router])

  async function fetchTestMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .like("id", "test_%")
      .order("created_at", { ascending: false })

    setTestMatches((data ?? []) as TestMatch[])
  }

  function generateRandomOdds() {
    const newOdds1 = parseFloat((Math.random() * 2 + 1.5).toFixed(2))
    const newOddsN = parseFloat((Math.random() * 1 + 2.5).toFixed(2))
    const newOdds2 = parseFloat((Math.random() * 2 + 1.5).toFixed(2))

    setOdds1(newOdds1)
    setOddsN(newOddsN)
    setOdds2(newOdds2)
    toast.success("Cotes générées aléatoirement ✨")
  }

  function generateRandomResult() {
    if (!selectedMatch) return

    // Generate random result (weighted: 40% 1, 30% N, 30% 2)
    const rand = Math.random()
    let h: number, a: number

    if (rand < 0.4) {
      // Home win: 1-0, 2-0, 2-1, 3-1, 3-0, 3-2
      const results = [[1, 0], [2, 0], [2, 1], [3, 1], [3, 0], [3, 2], [4, 1], [4, 2]]
      const result = results[Math.floor(Math.random() * results.length)]
      h = result[0]
      a = result[1]
    } else if (rand < 0.7) {
      // Draw: 0-0, 1-1, 2-2, 3-3
      const results = [[0, 0], [1, 1], [2, 2], [3, 3]]
      const result = results[Math.floor(Math.random() * results.length)]
      h = result[0]
      a = result[1]
    } else {
      // Away win: 0-1, 0-2, 1-2, 1-3, 0-3, 2-3
      const results = [[0, 1], [0, 2], [1, 2], [1, 3], [0, 3], [2, 3], [1, 4], [2, 4]]
      const result = results[Math.floor(Math.random() * results.length)]
      h = result[0]
      a = result[1]
    }

    setHomeScore(h)
    setAwayScore(a)

    // Generate realistic stats
    const homePoss = 30 + Math.random() * 40 // 30-70%
    const newStats = {
      homePossession: Math.round(homePoss),
      homeShots: 8 + Math.floor(Math.random() * 15),
      homeShotsOnTarget: Math.floor((h + 1) + Math.random() * 3),
      homeCorners: 3 + Math.floor(Math.random() * 8),
      homeYellowCards: Math.floor(Math.random() * 4),
      homeRedCards: Math.random() < 0.1 ? 1 : 0,
      awayPossession: 100 - Math.round(homePoss),
      awayShots: 8 + Math.floor(Math.random() * 15),
      awayShotsOnTarget: Math.floor((a + 1) + Math.random() * 3),
      awayCorners: 3 + Math.floor(Math.random() * 8),
      awayYellowCards: Math.floor(Math.random() * 4),
      awayRedCards: Math.random() < 0.1 ? 1 : 0,
    }
    setStats(newStats)
    toast.success("Résultat généré aléatoirement! 🎲")
  }

  async function createMatch() {
    if (!homeTeam || !awayTeam) {
      toast.error("Choisis 2 équipes")
      return
    }
    if (homeTeam === awayTeam) {
      toast.error("Les équipes doivent être différentes")
      return
    }

    setCreating(true)
    try {
      const comp = COMPETITIONS.find(c => c.key === competition)
      const kickoff = new Date()
      kickoff.setHours(kickoff.getHours() + 2)

      const res = await fetch("/api/test-matches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_team: homeTeam,
          away_team: awayTeam,
          competition: competition,
          competition_name: comp?.name,
          competition_color: comp?.color,
          odds_1: odds1,
          odds_n: oddsN,
          odds_2: odds2,
          kickoff: kickoff.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Match créé: ${homeTeam} vs ${awayTeam} 🎮`)
      setHomeTeam("")
      setAwayTeam("")
      setOdds1(2.15)
      setOddsN(3.45)
      setOdds2(3.20)
      await fetchTestMatches()
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création")
    } finally {
      setCreating(false)
    }
  }

  async function simulateMatchEnd() {
    if (!selectedMatch) {
      toast.error("Sélectionne un match")
      return
    }

    setSimulating(true)
    try {
      const res = await fetch("/api/test-matches/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: selectedMatch.id,
          home_score: homeScore,
          away_score: awayScore,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Match terminé: ${homeScore} - ${awayScore} 🏁`)
      setSelectedMatch(null)
      setHomeScore(0)
      setAwayScore(0)
      await fetchTestMatches()
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la simulation")
    } finally {
      setSimulating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--fg-3)]">Vérification...</p>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[var(--fg-1)] font-bold mb-2">Accès non autorisé</p>
          <p className="text-[var(--fg-3)] text-sm">Cette page est réservée aux admins</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-0)] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[32px] font-bold mb-8 text-[var(--fg-1)]">
          🎮 Test Matches Admin
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Création ── */}
          <div className="bg-[var(--bg-1)] rounded-xl p-6 border border-[var(--border-light)]">
            <h2 className="text-[20px] font-bold mb-4 text-[var(--fg-1)]">
              Créer un match
            </h2>

            {/* Équipes */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm text-[var(--fg-3)]">Équipe domicile</label>
              <select
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-2)] text-[var(--fg-1)]"
              >
                <option value="">Sélectionne une équipe</option>
                {TEAMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-sm text-[var(--fg-3)]">Équipe extérieure</label>
              <select
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-2)] text-[var(--fg-1)]"
              >
                <option value="">Sélectionne une équipe</option>
                {TEAMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-sm text-[var(--fg-3)]">Compétition</label>
              <select
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-2)] text-[var(--fg-1)]"
              >
                {COMPETITIONS.map(c => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Cotes */}
            <div className="bg-[var(--bg-3)] rounded-lg p-4 mb-4">
              <div className="flex justify-between gap-2 mb-3">
                <div className="flex-1">
                  <p className="text-xs text-[var(--fg-3)] mb-1">Victoire {homeTeam || "Domicile"}</p>
                  <p className="text-xl font-bold text-[var(--fg-1)]">{odds1.toFixed(2)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--fg-3)] mb-1">Nul</p>
                  <p className="text-xl font-bold text-[var(--fg-1)]">{oddsN.toFixed(2)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--fg-3)] mb-1">Victoire {awayTeam || "Extérieur"}</p>
                  <p className="text-xl font-bold text-[var(--fg-1)]">{odds2.toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={generateRandomOdds}
                className="w-full py-2 px-4 bg-[var(--emerald-500)] text-white rounded-lg font-semibold text-sm hover:bg-[var(--emerald-600)] transition"
              >
                🎲 Générer cotes aléatoires
              </button>
            </div>

            <button
              onClick={createMatch}
              disabled={creating}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-bold text-white transition",
                creating
                  ? "bg-[var(--fg-3)] opacity-60"
                  : "bg-[var(--emerald-600)] hover:bg-[var(--emerald-700)]"
              )}
            >
              {creating ? "Création..." : "✨ Créer le match"}
            </button>
          </div>

          {/* ── Simulation ── */}
          <div className="bg-[var(--bg-1)] rounded-xl p-6 border border-[var(--border-light)]">
            <h2 className="text-[20px] font-bold mb-4 text-[var(--fg-1)]">
              Simuler la fin
            </h2>

            {/* Liste des matchs */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm text-[var(--fg-3)]">Match</label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {testMatches.filter(m => m.state !== "done").length === 0 ? (
                  <p className="text-sm text-[var(--fg-3)]">Aucun match en cours</p>
                ) : (
                  testMatches
                    .filter(m => m.state !== "done")
                    .map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMatch(m)
                          setHomeScore(0)
                          setAwayScore(0)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition",
                          selectedMatch?.id === m.id
                            ? "bg-[var(--emerald-50)] border-[var(--emerald-300)]"
                            : "bg-[var(--bg-2)] border-[var(--border-light)] hover:bg-[var(--bg-3)]"
                        )}
                      >
                        <p className="font-semibold text-[var(--fg-1)]">
                          {m.home_team} vs {m.away_team}
                        </p>
                        <p className="text-xs text-[var(--fg-3)]">{m.competition_name}</p>
                      </button>
                    ))
                )}
              </div>
            </div>

            {selectedMatch && (
              <>
                {/* Bouton génération aléatoire */}
                <button
                  onClick={generateRandomResult}
                  className="w-full py-2 px-4 mb-4 bg-[var(--bg-3)] text-[var(--fg-1)] rounded-lg font-semibold text-sm hover:bg-[var(--bg-2)] transition"
                >
                  🎲 Générer résultat + stats
                </button>

                {/* Scores */}
                <div className="bg-[var(--bg-3)] rounded-lg p-4 mb-4">
                  <p className="text-sm text-[var(--fg-3)] mb-2">Score final</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-[var(--fg-3)] mb-1 block">{selectedMatch.home_team}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={homeScore}
                        onChange={(e) => setHomeScore(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-2)] text-[var(--fg-1)] text-center font-bold text-xl"
                      />
                    </div>
                    <span className="text-2xl font-bold text-[var(--fg-2)]">-</span>
                    <div className="flex-1">
                      <label className="text-xs text-[var(--fg-3)] mb-1 block">{selectedMatch.away_team}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={awayScore}
                        onChange={(e) => setAwayScore(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-2)] text-[var(--fg-1)] text-center font-bold text-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-[var(--bg-2)] rounded-lg p-3 mb-4 text-sm">
                  <p className="text-xs text-[var(--fg-3)] mb-2 font-bold">STATISTIQUES</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-[var(--fg-3)]">Possession</p>
                      <p className="text-xs font-bold text-[var(--fg-1)]">{stats.homePossession}% / {stats.awayPossession}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--fg-3)]">Tirs</p>
                      <p className="text-xs font-bold text-[var(--fg-1)]">{stats.homeShots} / {stats.awayShots}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--fg-3)]">Tirs cadrés</p>
                      <p className="text-xs font-bold text-[var(--fg-1)]">{stats.homeShotsOnTarget} / {stats.awayShotsOnTarget}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--fg-3)]">Corners</p>
                      <p className="text-xs font-bold text-[var(--fg-1)]">{stats.homeCorners} / {stats.awayCorners}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--fg-3)]">Cartons J</p>
                      <p className="text-xs font-bold text-[var(--fg-1)]">{stats.homeYellowCards} / {stats.awayYellowCards}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--fg-3)]">Cartons R</p>
                      <p className="text-xs font-bold text-[var(--fg-1)]">{stats.homeRedCards} / {stats.awayRedCards}</p>
                    </div>
                  </div>
                </div>

                {/* Résultat */}
                <div className="bg-[var(--bg-3)] rounded-lg p-3 mb-4">
                  <p className="text-sm text-[var(--fg-3)] mb-2">Résultat</p>
                  <p className="text-lg font-bold text-[var(--fg-1)]">
                    {homeScore > awayScore
                      ? `Victoire ${selectedMatch.home_team} 🎉`
                      : awayScore > homeScore
                      ? `Victoire ${selectedMatch.away_team} 🎉`
                      : "Nul 🤝"}
                  </p>
                </div>

                <button
                  onClick={simulateMatchEnd}
                  disabled={simulating}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-bold text-white transition",
                    simulating
                      ? "bg-[var(--fg-3)] opacity-60"
                      : "bg-[var(--emerald-600)] hover:bg-[var(--emerald-700)]"
                  )}
                >
                  {simulating ? "Simulation..." : "🏁 Simuler la fin"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Matchs créés ── */}
        <div className="mt-8">
          <h2 className="text-[20px] font-bold mb-4 text-[var(--fg-1)]">
            Matchs de test
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {testMatches.length === 0 ? (
              <p className="text-[var(--fg-3)]">Aucun match créé</p>
            ) : (
              testMatches.map(m => (
                <div
                  key={m.id}
                  className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-[var(--fg-1)]">
                      {m.home_team} vs {m.away_team}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-[var(--fg-3)]">
                      <span>{m.competition_name}</span>
                      {m.state === "done" && m.home_score !== undefined && m.away_score !== undefined && (
                        <span className="font-semibold text-[var(--emerald-500)]">
                          {m.home_score} - {m.away_score}
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        m.state === "done" ? "bg-[var(--emerald-50)] text-[var(--emerald-700)]" :
                        m.state === "live" ? "bg-[var(--error)] text-white" :
                        "bg-[var(--bg-3)] text-[var(--fg-2)]"
                      )}>
                        {m.state === "done" ? "Terminé" : m.state === "live" ? "EN DIRECT" : "À venir"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--fg-3)] mb-1">Cotes</p>
                    <div className="flex gap-2 text-sm font-bold text-[var(--fg-1)]">
                      <span>{m.odds_1}</span>
                      <span>{m.odds_n}</span>
                      <span>{m.odds_2}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
