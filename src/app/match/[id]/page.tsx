"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PremiumLock } from "@/components/ui/premium-lock"
import { BetSlipModal } from "@/components/match/BetSlipModal"
import { useBetSlip } from "@/contexts/BetSlipContext"
import { cn } from "@/lib/utils"
import type { Match } from "@/types"

/* ──────────────────────── types ────────────────────────────── */
interface OddsRow {
  key: string
  label: string
  outcomes: { key: string; label: string; price: number }[]
}

interface ApiBet {
  id: number
  name: string
  values: { value: string; odd: string }[]
}

/* ── Traductions françaises des marchés API-Football ─────────── */
const BET_NAMES: Record<string, string> = {
  "Match Winner": "Résultat final (1X2)",
  "Home/Away": "Nul remboursé (Draw No Bet)",
  "First Half Winner": "Résultat mi-temps",
  "Second Half Winner": "Résultat 2ème mi-temps",
  "Goals Over/Under": "Plus/Moins de buts",
  "Goals Over/Under First Half": "Plus/Moins de buts — 1ère MT",
  "Goals Over/Under Second Half": "Plus/Moins de buts — 2ème MT",
  "Both Teams Score": "Les deux équipes marquent",
  "Both Teams Score - First Half": "Les deux équipes marquent — 1ère MT",
  "Double Chance": "Double chance",
  "Double Chance - First Half": "Double chance — 1ère MT",
  "Exact Score": "Score exact",
  "Exact Score - First Half": "Score exact — 1ère MT",
  "Team To Score First": "1ère équipe à marquer",
  "Team To Score Last": "Dernière équipe à marquer",
  "Clean Sheet - Home": "Clean sheet Domicile",
  "Clean Sheet - Away": "Clean sheet Extérieur",
  "Win Both Halves": "Gagner les deux mi-temps",
  "Win Either Half": "Gagner au moins une mi-temps",
  "Score in Both Halves": "Marquer dans les deux mi-temps",
  "Highest Scoring Half": "Mi-temps la plus prolifique",
  "European Handicap": "Handicap européen",
  "Asian Handicap": "Handicap asiatique",
  "HT/FT Double": "Mi-temps / Final",
  "Odd/Even": "Nombre de buts Pair/Impair",
  "Result/Both Teams Score": "Résultat & les deux équipes marquent",
  "To Qualify": "Se qualifier",
}

const VALUE_NAMES: Record<string, string> = {
  Home: "Domicile", Draw: "Nul", Away: "Extérieur",
  Yes: "Oui", No: "Non",
  "No Goal": "Pas de but",
  Over: "Plus de", Under: "Moins de",
  "Home/Draw": "Dom. ou Nul", "Home/Away": "Dom. ou Ext.", "Draw/Away": "Nul ou Ext.",
  "Home Win": "Victoire domicile", "Away Win": "Victoire extérieur",
  "First Half": "1ère mi-temps", "Second Half": "2ème mi-temps", "Equal": "Égalité",
  "Odd": "Impair", "Even": "Pair",
}

function translateValue(val: string): string {
  if (VALUE_NAMES[val]) return VALUE_NAMES[val]
  // "Over 2.5" → "Plus de 2,5"
  const over = val.match(/^Over ([\d.]+)$/)
  if (over) return `Plus de ${over[1].replace(".", ",")}`
  const under = val.match(/^Under ([\d.]+)$/)
  if (under) return `Moins de ${under[1].replace(".", ",")}`
  // "1:0" reste tel quel (score exact)
  return val
}

interface SelectedOdds {
  market: string
  marketLabel: string
  selection: string
  selectionLabel: string
  odds: number
}

interface DetailedOdds {
  home: number | null; draw: number | null; away: number | null
  dnb_home: number | null; dnb_away: number | null
  dc_1n: number | null; dc_12: number | null; dc_n2: number | null
  ou15_over: number | null; ou15_under: number | null
  ou25_over: number | null; ou25_under: number | null
  ou35_over: number | null; ou35_under: number | null
  ou45_over: number | null; ou45_under: number | null
  btts_yes: number | null; btts_no: number | null
  ht_home: number | null; ht_draw: number | null; ht_away: number | null
  ouHT_over05: number | null; ouHT_under05: number | null
  ouHT_over15: number | null; ouHT_under15: number | null
  eh_home_m1: number | null; eh_draw_0: number | null; eh_away_p1: number | null
  cs_home_yes: number | null; cs_home_no: number | null
  tsf_home: number | null; tsf_none: number | null; tsf_away: number | null
  es_1_0: number | null; es_2_0: number | null; es_2_1: number | null
  es_0_0: number | null; es_1_1: number | null
  es_0_1: number | null; es_0_2: number | null; es_1_2: number | null
  es_3_0: number | null; es_3_1: number | null; es_3_2: number | null
}

interface MatchStats {
  possession_home: number; possession_away: number
  shots_home: number; shots_away: number
  shots_on_home: number; shots_on_away: number
  corners_home: number; corners_away: number
  fouls_home: number; fouls_away: number
  yellow_home: number; yellow_away: number
  red_home: number; red_away: number
  passes_home: number; passes_away: number
}

interface MatchEvent {
  minute: number; team: string; player: string; assist?: string
  type: string; detail: string
}

interface Lineup {
  team: string; formation: string; coach?: string
  startXI: { name: string; number: number; pos: string }[]
  substitutes: { name: string; number: number }[]
}

interface FormFixture {
  result: "W" | "D" | "L"
  score: string
  opponent: string
  date: string
  competition: string
}

interface H2HFixture {
  home: string
  away: string
  score: string
  date: string
  competition: string
  winner: "home" | "draw" | "away"
}

interface Predictions {
  winner: { name: string | null; comment: string | null }
  percent: { home: string; draw: string; away: string }
  advice: string
}

interface InjuryEntry {
  player: string
  reason: string
  type: string
}

interface Injuries {
  home: InjuryEntry[]
  away: InjuryEntry[]
}

const o = (v: number | null | undefined, fallback: number) => v && v > 1 ? v : fallback

/* ──────────────────── Odds market builders ──────────────────── */
function buildMarkets(m: Match, d?: DetailedOdds | null): OddsRow[] {
  const f1 = m.odds_1; const fn = m.odds_n; const f2 = m.odds_2
  return [
    {
      key: "result",
      label: "Résultat final (1X2)",
      outcomes: [
        { key: "1", label: m.home_team, price: o(d?.home, f1) },
        { key: "N", label: "Nul",       price: o(d?.draw, fn) },
        { key: "2", label: m.away_team, price: o(d?.away, f2) },
      ],
    },
    {
      key: "dnb",
      label: "Nul remboursé (Draw No Bet)",
      outcomes: [
        { key: "home", label: m.home_team, price: o(d?.dnb_home, +(f1 * 0.72).toFixed(2)) },
        { key: "away", label: m.away_team, price: o(d?.dnb_away, +(f2 * 0.72).toFixed(2)) },
      ],
    },
    {
      key: "dc",
      label: "Double chance",
      outcomes: [
        { key: "1N", label: `${m.home_team} ou Nul`, price: o(d?.dc_1n, +(f1 * 0.60).toFixed(2)) },
        { key: "12", label: "L'une ou l'autre",       price: o(d?.dc_12, +(Math.min(f1, f2) * 0.55).toFixed(2)) },
        { key: "N2", label: `Nul ou ${m.away_team}`,  price: o(d?.dc_n2, +(f2 * 0.60).toFixed(2)) },
      ],
    },
    {
      key: "tsf",
      label: "1ère équipe à marquer",
      outcomes: [
        { key: "home", label: m.home_team,  price: o(d?.tsf_home, +(f1 * 0.88).toFixed(2)) },
        { key: "none", label: "Pas de but", price: o(d?.tsf_none, 10.00) },
        { key: "away", label: m.away_team,  price: o(d?.tsf_away, +(f2 * 0.88).toFixed(2)) },
      ],
    },
    {
      key: "cs_home",
      label: `Clean sheet ${m.home_team}`,
      outcomes: [
        { key: "yes", label: "Oui (0 but encaissé)", price: o(d?.cs_home_yes, +(f1 * 0.85).toFixed(2)) },
        { key: "no",  label: "Non",                   price: o(d?.cs_home_no,  +(1.45).toFixed(2)) },
      ],
    },
  ]
}

function buildGoalMarkets(_m: Match, d?: DetailedOdds | null): OddsRow[] {
  return [
    {
      key: "ou15",
      label: "Plus/Moins de 1,5 buts",
      outcomes: [
        { key: "over",  label: "Plus de 1,5",  price: o(d?.ou15_over,  1.35) },
        { key: "under", label: "Moins de 1,5", price: o(d?.ou15_under, 3.10) },
      ],
    },
    {
      key: "ou25",
      label: "Plus/Moins de 2,5 buts",
      outcomes: [
        { key: "over",  label: "Plus de 2,5",  price: o(d?.ou25_over,  1.80) },
        { key: "under", label: "Moins de 2,5", price: o(d?.ou25_under, 2.00) },
      ],
    },
    {
      key: "ou35",
      label: "Plus/Moins de 3,5 buts",
      outcomes: [
        { key: "over",  label: "Plus de 3,5",  price: o(d?.ou35_over,  2.50) },
        { key: "under", label: "Moins de 3,5", price: o(d?.ou35_under, 1.50) },
      ],
    },
    {
      key: "ou45",
      label: "Plus/Moins de 4,5 buts",
      outcomes: [
        { key: "over",  label: "Plus de 4,5",  price: o(d?.ou45_over,  4.00) },
        { key: "under", label: "Moins de 4,5", price: o(d?.ou45_under, 1.22) },
      ],
    },
    {
      key: "btts",
      label: "Les deux équipes marquent",
      outcomes: [
        { key: "yes", label: "Oui", price: o(d?.btts_yes, 1.75) },
        { key: "no",  label: "Non", price: o(d?.btts_no,  2.00) },
      ],
    },
  ]
}

function buildHalfMarkets(m: Match, d?: DetailedOdds | null): OddsRow[] {
  const f1 = m.odds_1; const fn = m.odds_n; const f2 = m.odds_2
  return [
    {
      key: "ht",
      label: "Résultat à la mi-temps (1X2)",
      outcomes: [
        { key: "1", label: m.home_team, price: o(d?.ht_home, +(f1 * 1.4).toFixed(2)) },
        { key: "N", label: "Nul",       price: o(d?.ht_draw, +(fn * 0.75).toFixed(2)) },
        { key: "2", label: m.away_team, price: o(d?.ht_away, +(f2 * 1.4).toFixed(2)) },
      ],
    },
    {
      key: "ouHT05",
      label: "Buts 1ère mi-temps — Plus/Moins 0,5",
      outcomes: [
        { key: "over",  label: "Plus de 0,5",  price: o(d?.ouHT_over05,  1.55) },
        { key: "under", label: "Moins de 0,5", price: o(d?.ouHT_under05, 2.35) },
      ],
    },
    {
      key: "ouHT15",
      label: "Buts 1ère mi-temps — Plus/Moins 1,5",
      outcomes: [
        { key: "over",  label: "Plus de 1,5",  price: o(d?.ouHT_over15,  2.80) },
        { key: "under", label: "Moins de 1,5", price: o(d?.ouHT_under15, 1.40) },
      ],
    },
    {
      key: "eh",
      label: `Handicap européen — ${m.home_team} -1`,
      outcomes: [
        { key: "h-1", label: `${m.home_team} -1`, price: o(d?.eh_home_m1, +(f1 * 2.1).toFixed(2)) },
        { key: "d0",  label: "Nul (0)",             price: o(d?.eh_draw_0,  +(fn * 1.05).toFixed(2)) },
        { key: "a+1", label: `${m.away_team} +1`,  price: o(d?.eh_away_p1, +(f2 * 1.6).toFixed(2)) },
      ],
    },
  ]
}

function buildExactScoreMarkets(m: Match, d?: DetailedOdds | null): OddsRow[] {
  const f1 = m.odds_1; const f2 = m.odds_2
  return [
    {
      key: "es_home",
      label: `Score exact — Victoire ${m.home_team}`,
      outcomes: [
        { key: "1:0", label: "1-0", price: o(d?.es_1_0, +(f1 * 5.2).toFixed(2)) },
        { key: "2:0", label: "2-0", price: o(d?.es_2_0, +(f1 * 7.5).toFixed(2)) },
        { key: "2:1", label: "2-1", price: o(d?.es_2_1, +(f1 * 8.0).toFixed(2)) },
        { key: "3:0", label: "3-0", price: o(d?.es_3_0, +(f1 * 14.0).toFixed(2)) },
        { key: "3:1", label: "3-1", price: o(d?.es_3_1, +(f1 * 15.0).toFixed(2)) },
        { key: "3:2", label: "3-2", price: o(d?.es_3_2, +(f1 * 22.0).toFixed(2)) },
      ],
    },
    {
      key: "es_draw",
      label: "Score exact — Match nul",
      outcomes: [
        { key: "0:0", label: "0-0", price: o(d?.es_0_0, 6.50) },
        { key: "1:1", label: "1-1", price: o(d?.es_1_1, 5.50) },
      ],
    },
    {
      key: "es_away",
      label: `Score exact — Victoire ${m.away_team}`,
      outcomes: [
        { key: "0:1", label: "0-1", price: o(d?.es_0_1, +(f2 * 5.2).toFixed(2)) },
        { key: "0:2", label: "0-2", price: o(d?.es_0_2, +(f2 * 7.5).toFixed(2)) },
        { key: "1:2", label: "1-2", price: o(d?.es_1_2, +(f2 * 8.0).toFixed(2)) },
      ],
    },
  ]
}

/* ──────────────────── stat bar ──────────────────────────────── */
function StatBar({
  label,
  home,
  away,
  max,
  unit = "",
}: {
  label: string
  home: number
  away: number
  max: number
  unit?: string
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">{home}{unit}</span>
        <span className="text-[var(--fg-3)]">{label}</span>
        <span className="font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">{away}{unit}</span>
      </div>
      <div className="flex gap-[3px] h-[6px]">
        <div className="flex-1 bg-[var(--bg-3)] rounded-l-full overflow-hidden flex justify-end">
          <div
            className="h-full bg-[var(--emerald-500)] rounded-l-full transition-all duration-700"
            style={{ width: `${(home / max) * 100}%` }}
          />
        </div>
        <div className="flex-1 bg-[var(--bg-3)] rounded-r-full overflow-hidden">
          <div
            className="h-full bg-[#6B7280] rounded-r-full transition-all duration-700"
            style={{ width: `${(away / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── odds market block ────────────────────── */
function MarketBlock({
  market,
  selectedKey,
  onSelect,
}: {
  market: OddsRow
  selectedKey: string | null
  onSelect: (o: { key: string; label: string; price: number }) => void
}) {
  return (
    <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                    p-4 [box-shadow:var(--shadow-card)]">
      <p className="text-[13px] font-semibold text-[var(--fg-2)] mb-3">{market.label}</p>
      <div className={cn(
        "grid gap-2",
        market.outcomes.length === 2 ? "grid-cols-2" :
        market.outcomes.length <= 4  ? "grid-cols-2" :
        "grid-cols-3"
      )}>
        {market.outcomes.map(o => {
          const selKey = `${market.key}:${o.key}`
          const isSelected = selectedKey === selKey
          return (
            <button
              key={o.key}
              onClick={() => onSelect(o)}
              className={cn(
                "flex flex-col items-center py-3 px-2 rounded-[var(--radius-btn)] border",
                "transition-all duration-150 active:scale-95",
                isSelected
                  ? "bg-[var(--emerald-500)] border-[var(--emerald-500)]"
                  : "bg-[var(--bg-2)] border-[var(--border-light)] hover:bg-[var(--bg-3)]"
              )}>
              <span className={cn(
                "text-[10px] mb-[3px] text-center leading-tight",
                isSelected ? "text-[rgba(255,255,255,0.8)]" : "text-[var(--fg-3)]"
              )}>
                {o.label}
              </span>
              <span className={cn(
                "text-[17px] font-bold [font-family:var(--font-display)]",
                isSelected ? "text-white" : "text-[var(--fg-1)]"
              )}>
                {o.price.toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────── bet slip ──────────────────────────────── */
function BetSlip({
  match,
  sel,
  onClose,
}: {
  match: Match
  sel: SelectedOdds
  onClose: () => void
}) {
  const [stake, setStake] = useState(10)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const potentialGain = +(stake * sel.odds).toFixed(2)

  async function placeBet() {
    setLoading(true)
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          match_label: `${match.home_team} – ${match.away_team}`,
          market: sel.market,
          selection: sel.selection,
          odds: sel.odds,
          stake,
          potential_gain: potentialGain,
          is_live: match.state === "live",
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => { onClose(); setSuccess(false) }, 1400)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="max-w-[430px] mx-auto">
        <div className="bg-[var(--bg-1)] border-t border-[var(--border-light)]
                        rounded-t-[20px] shadow-[var(--shadow-modal)] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[16px] [font-family:var(--font-display)] text-[var(--fg-1)]">
              Confirmer le pari
            </span>
            <button onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-3)]">
              <i className="ti ti-x text-[15px] text-[var(--fg-2)]" />
            </button>
          </div>

          <div className="bg-[var(--bg-2)] rounded-[12px] p-3 mb-4 space-y-[6px]">
            <p className="text-[12px] text-[var(--fg-3)]">{match.home_team} – {match.away_team}</p>
            <p className="text-[14px] font-semibold text-[var(--fg-1)]">{sel.marketLabel}</p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--emerald-600)] font-bold">{sel.selectionLabel}</span>
              <span className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                {sel.odds.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <label className="text-[11px] text-[var(--fg-3)] block mb-1">Mise (B)</label>
              <div className="flex items-center border border-[var(--border-light)] rounded-[10px] overflow-hidden">
                <button onClick={() => setStake(s => Math.max(1, s - 5))}
                        className="w-10 h-10 flex items-center justify-center bg-[var(--bg-2)] text-[var(--fg-2)]">
                  <i className="ti ti-minus text-[14px]" />
                </button>
                <input
                  type="number"
                  value={stake}
                  min={1}
                  onChange={e => setStake(Math.max(1, Number(e.target.value)))}
                  className="flex-1 text-center font-bold text-[16px] [font-family:var(--font-display)]
                             bg-transparent outline-none text-[var(--fg-1)] py-2"
                />
                <button onClick={() => setStake(s => s + 5)}
                        className="w-10 h-10 flex items-center justify-center bg-[var(--bg-2)] text-[var(--fg-2)]">
                  <i className="ti ti-plus text-[14px]" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[var(--fg-3)]">Gain potentiel</p>
              <p className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--emerald-500)]">
                {potentialGain} B
              </p>
            </div>
          </div>

          <button
            onClick={placeBet}
            disabled={loading || success}
            className={cn(
              "w-full py-[14px] rounded-[var(--radius-btn)] font-bold text-[15px] [font-family:var(--font-display)]",
              "transition-all duration-200 active:scale-[.98]",
              success
                ? "bg-[var(--emerald-100)] text-[var(--emerald-900)]"
                : "bg-[var(--emerald-500)] text-white hover:bg-[var(--emerald-600)]",
              loading && "opacity-60"
            )}>
            {success
              ? <span className="flex items-center justify-center gap-2"><i className="ti ti-circle-check" /> Pari confirmé !</span>
              : loading ? "Envoi…" : "Confirmer le pari"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── PAGE ────────────────────────────── */
export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { addSelection } = useBetSlip()

  const [match, setMatch]           = useState<Match | null>(null)
  const [stats, setStats]           = useState<MatchStats | null>(null)
  const [events, setEvents]         = useState<MatchEvent[] | null>(null)
  const [lineups, setLineups]       = useState<Lineup[] | null>(null)
  const [detailedOdds, setDetailedOdds] = useState<DetailedOdds | null>(null)
  const [allBets, setAllBets]       = useState<ApiBet[]>([])
  const [formHome, setFormHome]     = useState<FormFixture[] | null>(null)
  const [formAway, setFormAway]     = useState<FormFixture[] | null>(null)
  const [h2h, setH2h]               = useState<H2HFixture[] | null>(null)
  const [predictions, setPredictions] = useState<Predictions | null>(null)
  const [injuries, setInjuries]     = useState<Injuries | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [isFav, setIsFav]         = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/match/${id}`)
      .then(r => r.json())
      .then(data => {
        setMatch(data.match ?? null)
        setStats(data.stats ?? null)
        setEvents(data.events ?? null)
        setLineups(data.lineups ?? null)
        setDetailedOdds(data.detailedOdds ?? null)
        setAllBets(data.allBets ?? [])
        setFormHome(data.formHome ?? null)
        setFormAway(data.formAway ?? null)
        setH2h(data.h2h ?? null)
        setPredictions(data.predictions ?? null)
        setInjuries(data.injuries ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[var(--bg-1)] flex items-center justify-center">
        <div className="skeleton w-48 h-6 rounded" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center">
        <p className="text-[var(--fg-3)]">Match introuvable.</p>
      </div>
    )
  }

  const isLive = match.state === "live"
  const isDone = match.state === "done"
  const isSoon = match.state === "soon"

  // Fonction pour obtenir le fond selon la compétition
  function getCompetitionBackground() {
    const comp = match?.competition
    switch (comp) {
      case "CDM": // Coupe du Monde
        return "url('/backgrounds/cdm.png')"
      case "UCL": // Ligue des Champions
        return "url('/backgrounds/ucl.png')"
      case "EL": // Europa League
        return "url('/backgrounds/el.png')"
      case "ECL": // Conference League
        return "url('/backgrounds/ecl.png')"
      case "Bundesliga": // Bundesliga
        return "url('/backgrounds/bundesliga.png')"
      default: // Défaut
        return "url('/backgrounds/bundesliga.png')"
    }
  }

  // "Tous" visible pour tous les matchs apf- (API-Football) même si allBets est vide
  const isApfMatch  = match.id.startsWith("apf-")
  const hasRealOdds = allBets.length > 0 || !!detailedOdds || isApfMatch
  const hasTeamData = !!(formHome || formAway || h2h)
  const hasEvents   = events && events.length > 0
  const hasLineups  = lineups && lineups.length > 0
  const hasPredictions = !!predictions
  // Marchés buteurs = bet ID 9 (1er buteur) ou 10 (dernier) ou 13 (à tout moment)
  const goalScorerBets = allBets.filter(b => [9, 10, 13].includes(b.id))
  const hasGoalScorer  = goalScorerBets.length > 0
  const tabs = isLive
    ? ["Résultat live", "Buts", "Mi-temps", "Score exact", "Tous", ...(hasTeamData ? ["Équipes"] : []), ...(hasPredictions ? ["Prono"] : []), ...(hasEvents ? ["Événements"] : []), ...(hasLineups ? ["Compos"] : []), "Stats"]
    : ["Résultat", "Buts", "Mi-temps", "Score exact", "Tous", ...(hasTeamData ? ["Équipes"] : []), ...(hasPredictions ? ["Prono"] : []), ...(hasLineups ? ["Compos"] : []), "Buteurs", "Stats"]

  const resultMarkets    = buildMarkets(match, detailedOdds)
  const goalMarkets      = buildGoalMarkets(match, detailedOdds)
  const halfMarkets      = buildHalfMarkets(match, detailedOdds)
  const exactScoreMarkets = buildExactScoreMarkets(match, detailedOdds)

  const statData = stats ? [
    { label: "Possession", home: stats.possession_home, away: stats.possession_away, max: 100, unit: "%" },
    { label: "Tirs",       home: stats.shots_home,      away: stats.shots_away,      max: Math.max(20, stats.shots_home + stats.shots_away) },
    { label: "Cadrés",     home: stats.shots_on_home,   away: stats.shots_on_away,   max: Math.max(10, stats.shots_on_home + stats.shots_on_away) },
    { label: "Passes",     home: stats.passes_home,     away: stats.passes_away,     max: Math.max(100, stats.passes_home, stats.passes_away) },
    { label: "Corners",    home: stats.corners_home,    away: stats.corners_away,    max: Math.max(12, stats.corners_home + stats.corners_away) },
    { label: "Fautes",     home: stats.fouls_home,      away: stats.fouls_away,      max: Math.max(25, stats.fouls_home + stats.fouls_away) },
    { label: "Cartons J.", home: stats.yellow_home,     away: stats.yellow_away,     max: Math.max(6, stats.yellow_home + stats.yellow_away) },
  ] : []

  // Buts & cartons depuis les events API-Football
  const goalEvents = (events ?? []).filter(e => e.type === "Goal" && e.detail !== "Missed Penalty")
  const cardEvents = (events ?? []).filter(e => e.type === "Card")

  function handleMarketSelect(market: OddsRow, o: { key: string; label: string; price: number }) {
    const k = `${market.key}:${o.key}`
    if (selectedKey === k) {
      setSelectedKey(null)
      return
    }
    setSelectedKey(k)
    addSelection({
      matchId: id,
      matchLabel: `${match?.home_team} – ${match?.away_team}`,
      market: market.key,
      marketLabel: market.label,
      selection: o.key,
      selectionLabel: o.label,
      odds: o.price,
    })
  }

  const tabContent = () => {
    const tabLabel = tabs[activeTab]

    if (tabLabel === "Résultat live" || tabLabel === "Résultat") {
      if (isDone) {
        return (
          <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
            <i className="ti ti-lock text-[24px] text-[var(--fg-3)] mb-2 block" />
            <p className="text-[13px] font-semibold text-[var(--fg-2)]">Match terminé — paris fermés</p>
            <p className="text-[12px] text-[var(--fg-3)] mt-1">
              Score final : {match.home_score} – {match.away_score}
            </p>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-3">
          {resultMarkets.map(mkt => (
            <MarketBlock
              key={mkt.key}
              market={mkt}
              selectedKey={selectedKey}
              onSelect={o => handleMarketSelect(mkt, o)}
            />
          ))}
        </div>
      )
    }

    if (tabLabel === "Buts") {
      if (isDone) {
        return (
          <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
            <i className="ti ti-lock text-[24px] text-[var(--fg-3)] mb-2 block" />
            <p className="text-[13px] font-semibold text-[var(--fg-2)]">Match terminé — paris fermés</p>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-3">
          {goalMarkets.map(mkt => (
            <MarketBlock
              key={mkt.key}
              market={mkt}
              selectedKey={selectedKey}
              onSelect={o => handleMarketSelect(mkt, o)}
            />
          ))}
        </div>
      )
    }

    if (tabLabel === "Mi-temps") {
      if (isDone) {
        return (
          <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
            <i className="ti ti-lock text-[24px] text-[var(--fg-3)] mb-2 block" />
            <p className="text-[13px] font-semibold text-[var(--fg-2)]">Match terminé — paris fermés</p>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-3">
          {halfMarkets.map(mkt => (
            <MarketBlock
              key={mkt.key}
              market={mkt}
              selectedKey={selectedKey}
              onSelect={o => handleMarketSelect(mkt, o)}
            />
          ))}
        </div>
      )
    }

    if (tabLabel === "Score exact") {
      if (isDone) {
        return (
          <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
            <i className="ti ti-lock text-[24px] text-[var(--fg-3)] mb-2 block" />
            <p className="text-[13px] font-semibold text-[var(--fg-2)]">Match terminé — paris fermés</p>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-3">
          {exactScoreMarkets.map(mkt => (
            <MarketBlock
              key={mkt.key}
              market={mkt}
              selectedKey={selectedKey}
              onSelect={o => handleMarketSelect(mkt, o)}
            />
          ))}
        </div>
      )
    }

    if (tabLabel === "Tous") {
      if (isDone) {
        return (
          <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
            <i className="ti ti-lock text-[24px] text-[var(--fg-3)] mb-2 block" />
            <p className="text-[13px] font-semibold text-[var(--fg-2)]">Match terminé — paris fermés</p>
          </div>
        )
      }

      // Si allBets disponibles (API-Football odds endpoint) → tous les marchés bruts
      if (allBets.length > 0) {
        return (
          <div className="flex flex-col gap-3 pb-2">
            <p className="text-[11px] text-[var(--fg-3)] px-1">
              {allBets.length} marchés disponibles
            </p>
            {allBets.map(bet => {
              const mkt: OddsRow = {
                key: `api-${bet.id}`,
                label: BET_NAMES[bet.name] ?? bet.name,
                outcomes: bet.values.map(v => ({
                  key: v.value,
                  label: translateValue(v.value),
                  price: parseFloat(v.odd) || 1.01,
                })),
              }
              return (
                <MarketBlock key={mkt.key} market={mkt} selectedKey={selectedKey} onSelect={o => handleMarketSelect(mkt, o)} />
              )
            })}
          </div>
        )
      }

      // Fallback : afficher tous les marchés construits depuis detailedOdds
      const allMarketsFromOdds = [
        ...resultMarkets,
        ...goalMarkets,
        ...halfMarkets,
        ...exactScoreMarkets,
      ]
      if (allMarketsFromOdds.length === 0) {
        return (
          <div className="text-center py-10 text-[var(--fg-3)] text-[13px]">
            <i className="ti ti-lock text-[32px] block mb-2" />
            Marchés détaillés non disponibles pour ce match
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-[11px] text-[var(--fg-3)] px-1">
            {allMarketsFromOdds.length} marchés disponibles
          </p>
          {allMarketsFromOdds.map(mkt => (
            <MarketBlock key={mkt.key} market={mkt} selectedKey={selectedKey} onSelect={o => handleMarketSelect(mkt, o)} />
          ))}
        </div>
      )
    }

    if (tabLabel === "Équipes") {
      const ResultBadge = ({ r }: { r: "W"|"D"|"L" }) => (
        <span className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0",
          r === "W" ? "bg-[var(--emerald-500)]" : r === "L" ? "bg-[var(--error)]" : "bg-[var(--fg-3)]"
        )}>{r}</span>
      )

      const FormRow = ({ label, form }: { label: string; form: FormFixture[] }) => (
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-[var(--fg-3)] mb-2 uppercase tracking-wide">{label}</p>
          <div className="flex items-center gap-2 mb-3">
            {form.map((f, i) => <ResultBadge key={i} r={f.result} />)}
          </div>
          <div className="flex flex-col gap-1">
            {form.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]">
                <ResultBadge r={f.result} />
                <span className="font-bold [font-family:var(--font-display)] w-10 text-[var(--fg-1)]">{f.score}</span>
                <span className="flex-1 text-[var(--fg-2)] truncate">{f.opponent}</span>
                <span className="text-[var(--fg-3)] shrink-0">
                  {new Date(f.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )

      return (
        <div className="flex flex-col gap-4">
          {/* Forme récente */}
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                          p-4 [box-shadow:var(--shadow-card)]">
            <p className="text-[14px] font-bold text-[var(--fg-1)] mb-4">Forme récente</p>
            {formHome && <FormRow label={match.home_team} form={formHome} />}
            {formAway && <FormRow label={match.away_team} form={formAway} />}
            {!formHome && !formAway && (
              <p className="text-center text-[var(--fg-3)] text-[13px] py-4">Données indisponibles</p>
            )}
          </div>

          {/* Face-à-face */}
          {h2h && h2h.length > 0 && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                            p-4 [box-shadow:var(--shadow-card)]">
              <p className="text-[14px] font-bold text-[var(--fg-1)] mb-3">Face-à-face</p>
              <div className="flex flex-col gap-2">
                {h2h.map((f, i) => {
                  const isHomeWin = f.winner === "home"
                  const isAwayWin = f.winner === "away"
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-[var(--border-light)] last:border-0">
                      <span className={cn(
                        "text-[12px] font-semibold flex-1 text-right truncate",
                        isHomeWin ? "text-[var(--emerald-500)]" : "text-[var(--fg-2)]"
                      )}>{f.home}</span>
                      <span className="font-bold [font-family:var(--font-display)] text-[14px] text-[var(--fg-1)] shrink-0 w-14 text-center">
                        {f.score}
                      </span>
                      <span className={cn(
                        "text-[12px] font-semibold flex-1 truncate",
                        isAwayWin ? "text-[var(--emerald-500)]" : "text-[var(--fg-2)]"
                      )}>{f.away}</span>
                      <span className="text-[10px] text-[var(--fg-3)] shrink-0">
                        {new Date(f.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Absents */}
          {injuries && (injuries.home.length > 0 || injuries.away.length > 0) && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                            p-4 [box-shadow:var(--shadow-card)]">
              <p className="text-[14px] font-bold text-[var(--fg-1)] mb-3">Absents</p>
              {[
                { label: match.home_team, list: injuries.home },
                { label: match.away_team, list: injuries.away },
              ].map(({ label, list }) => list.length > 0 && (
                <div key={label} className="mb-3 last:mb-0">
                  <p className="text-[12px] font-semibold text-[var(--fg-3)] uppercase tracking-wide mb-2">{label}</p>
                  <div className="flex flex-col gap-2">
                    {list.map((inj, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[var(--bg-2)] rounded-[8px] px-3 py-2">
                        <i className="ti ti-bandage text-[var(--error)] text-[16px] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--fg-1)] truncate">{inj.player}</p>
                          <p className="text-[11px] text-[var(--fg-3)]">{inj.reason || inj.type}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--error)] shrink-0">{inj.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (tabLabel === "Buteurs") {
      const BET_SCORER_NAMES: Record<number, string> = {
        9: "1er buteur",
        10: "Dernier buteur",
        13: "Buteur à tout moment",
      }
      return (
        <div className="flex flex-col gap-3 pb-2">
          {goalScorerBets.length === 0 ? (
            <div className="text-center py-10 text-[var(--fg-3)] text-[13px]">
              <i className="ti ti-ball-football text-[32px] block mb-2" />
              Marchés buteurs non disponibles pour ce match
            </div>
          ) : goalScorerBets.map(bet => {
            const mkt: OddsRow = {
              key: `scorer-${bet.id}`,
              label: BET_SCORER_NAMES[bet.id] ?? bet.name,
              outcomes: bet.values.map(v => ({
                key: v.value,
                label: v.value,
                price: parseFloat(v.odd) || 1.01,
              })),
            }
            return (
              <MarketBlock
                key={mkt.key}
                market={mkt}
                selectedKey={selectedKey}
                onSelect={o => handleMarketSelect(mkt, o)}
              />
            )
          })}
        </div>
      )
    }

    if (tabLabel === "Événements") {
      const allEvents = [...(events ?? [])].sort((a, b) => a.minute - b.minute)
      return (
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                        p-4 [box-shadow:var(--shadow-card)]">
          <p className="text-[14px] font-bold text-[var(--fg-1)] mb-4">Événements du match</p>
          {allEvents.length === 0 ? (
            <p className="text-center text-[var(--fg-3)] text-[13px] py-4">Aucun événement disponible</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allEvents.map((e, i) => {
                const isHome = e.team === match.home_team
                const isGoal = e.type === "Goal" && e.detail !== "Missed Penalty"
                const isYellow = e.type === "Card" && e.detail === "Yellow Card"
                const isRed = e.type === "Card" && (e.detail === "Red Card" || e.detail === "Second Yellow card")
                const isSub = e.type === "subst"
                const icon = isGoal ? "⚽" : isYellow ? "🟨" : isRed ? "🟥" : isSub ? "🔄" : "•"
                return (
                  <div key={i} className={cn(
                    "flex items-center gap-3 py-2 border-b border-[var(--border-light)] last:border-0",
                    !isHome && "flex-row-reverse"
                  )}>
                    <span className="text-[12px] font-bold text-[var(--fg-3)] w-8 text-center shrink-0">
                      {e.minute}&apos;
                    </span>
                    <span className="text-[16px] shrink-0">{icon}</span>
                    <div className={cn("flex-1", !isHome && "text-right")}>
                      <p className="text-[13px] font-semibold text-[var(--fg-1)]">{e.player}</p>
                      <p className="text-[11px] text-[var(--fg-3)]">{e.team}</p>
                      {e.assist && <p className="text-[11px] text-[var(--fg-3)]">Passe : {e.assist}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    if (tabLabel === "Compos") {
      return (
        <div className="flex flex-col gap-4">
          {(lineups ?? []).map((lineup, li) => (
            <div key={li} className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                                    p-4 [box-shadow:var(--shadow-card)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-bold text-[var(--fg-1)]">{lineup.team}</p>
                <span className="text-[12px] font-semibold text-[var(--emerald-500)] bg-[var(--emerald-50)] px-2 py-1 rounded-full">
                  {lineup.formation}
                </span>
              </div>
              {lineup.coach && (
                <p className="text-[12px] text-[var(--fg-3)] mb-3">Coach : {lineup.coach}</p>
              )}
              <div className="grid grid-cols-2 gap-[6px]">
                {lineup.startXI.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-2 bg-[var(--bg-2)] rounded-[8px] px-2 py-[6px]">
                    <span className="w-6 h-6 rounded-full bg-[var(--emerald-500)] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {p.number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--fg-1)] truncate">{p.name}</p>
                      <p className="text-[10px] text-[var(--fg-3)]">{p.pos}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!lineups || lineups.length === 0) && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
              <p className="text-[13px] text-[var(--fg-3)] py-4">Compositions indisponibles</p>
            </div>
          )}
        </div>
      )
    }

    if (tabLabel === "Prono") {
      if (!predictions) {
        return (
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 text-center">
            <p className="text-[13px] text-[var(--fg-3)] py-4">Pronostics indisponibles</p>
          </div>
        )
      }
      const pctHome = parseInt(predictions.percent.home) || 0
      const pctDraw = parseInt(predictions.percent.draw) || 0
      const pctAway = parseInt(predictions.percent.away) || 0
      return (
        <div className="flex flex-col gap-4">
          {/* Pourcentages */}
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                          p-4 [box-shadow:var(--shadow-card)]">
            <p className="text-[14px] font-bold text-[var(--fg-1)] mb-4">Probabilités</p>
            <div className="flex flex-col gap-4">
              {[
                { label: match.home_team, pct: pctHome, color: "var(--emerald-500)" },
                { label: "Nul",           pct: pctDraw, color: "var(--fg-3)" },
                { label: match.away_team, pct: pctAway, color: "#6B7280" },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-[6px]">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-semibold text-[var(--fg-1)]">{row.label}</span>
                    <span className="font-bold [font-family:var(--font-display)]" style={{ color: row.color }}>{row.pct}%</span>
                  </div>
                  <div className="h-[8px] bg-[var(--bg-3)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conseil */}
          {predictions.advice && (
            <div className="bg-[var(--emerald-50)] border border-[var(--emerald-500)] rounded-[var(--radius-card)] p-4">
              <p className="text-[12px] font-semibold text-[var(--emerald-600)] uppercase tracking-wide mb-1">Conseil de pari</p>
              <p className="text-[14px] font-bold text-[var(--fg-1)]">{predictions.advice}</p>
            </div>
          )}

          {/* Vainqueur prédit */}
          {predictions.winner.name && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 [box-shadow:var(--shadow-card)]">
              <p className="text-[12px] font-semibold text-[var(--fg-3)] uppercase tracking-wide mb-1">Vainqueur prédit</p>
              <p className="text-[16px] font-bold text-[var(--fg-1)]">{predictions.winner.name}</p>
              {predictions.winner.comment && (
                <p className="text-[12px] text-[var(--fg-3)] mt-1">{predictions.winner.comment}</p>
              )}
            </div>
          )}

          {/* Forme récente (résumé) */}
          {(formHome || formAway) && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4 [box-shadow:var(--shadow-card)]">
              <p className="text-[14px] font-bold text-[var(--fg-1)] mb-3">Forme récente (5 matchs)</p>
              {[{ label: match.home_team, form: formHome }, { label: match.away_team, form: formAway }].map(({ label, form }) => form && (
                <div key={label} className="mb-3 last:mb-0">
                  <p className="text-[12px] font-semibold text-[var(--fg-3)] mb-2">{label}</p>
                  <div className="flex gap-[6px]">
                    {form.map((f, i) => (
                      <span key={i} className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0",
                        f.result === "W" ? "bg-[var(--emerald-500)]" : f.result === "L" ? "bg-[var(--error)]" : "bg-[var(--fg-3)]"
                      )}>{f.result}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (tabLabel === "Stats") {
      return (
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                        p-5 [box-shadow:var(--shadow-card)]">
          <div className="flex justify-between text-[12px] text-[var(--fg-3)] mb-4">
            <span className="font-semibold">{match.home_team}</span>
            <span>Statistiques</span>
            <span className="font-semibold">{match.away_team}</span>
          </div>
          {statData.length === 0 ? (
            <p className="text-center text-[var(--fg-3)] text-[13px] py-4">
              {match.state === "soon" ? "Stats disponibles pendant et après le match" : "Aucune statistique disponible"}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {statData.map(s => (
                <StatBar key={s.label} {...s} />
              ))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-1)]
                    flex flex-col md:flex-row pb-[90px] md:pb-0">

      {/* ── Match header — AGRANDIS AVEC FOND DYNAMIQUE ET OVERLAY ── */}
      <div
        className="w-full md:w-[35%] md:sticky md:top-0 md:h-screen md:overflow-y-auto relative px-4 md:px-5 pt-3 md:pt-6 pb-6 bg-cover bg-center"
        style={{ backgroundImage: getCompetitionBackground() }}
      >
        {/* Overlay sombre pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Content wrapper - positioned above overlay */}
        <div className="relative z-10">

        {/* top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] transition-colors">
            <i className="ti ti-chevron-down text-white text-[20px]" />
          </button>
          <span className="text-white font-bold text-[13px] truncate px-2 flex-1 text-center">
            {match.competition_name}
          </span>
          <button
            onClick={() => setIsFav(f => !f)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] transition-colors">
            <i className={cn(
              "ti text-[18px] transition-colors",
              isFav ? "ti-heart-filled text-[var(--error)]" : "ti-heart text-white"
            )} />
          </button>
        </div>

        {/* state badge */}
        <div className="flex justify-center mb-4">
          {isLive && (
            <span className="flex items-center gap-[6px] px-3 py-1 rounded-full bg-[var(--error)]
                             text-white text-[12px] font-bold animate-pulse-live">
              <span className="w-[6px] h-[6px] rounded-full bg-white" />
              LIVE · {match.minute}
            </span>
          )}
          {isSoon && (
            <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.18)] text-white text-[12px] font-semibold">
              {new Date(match.kickoff).toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris"
              })}
            </span>
          )}
          {isDone && (
            <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.18)] text-white text-[12px] font-semibold">
              Terminé
            </span>
          )}
        </div>

        {/* teams + score — AGRANDIS */}
        <div className="space-y-5">
          {/* Compétition + Heure */}
          <div className="text-center">
            <p className="text-white text-[15px] font-bold mb-2">{match.competition_name || match.competition}</p>
            {!isLive && !isDone && (
              <p className="text-white text-[18px] font-bold [font-family:var(--font-display)] opacity-90">
                {new Date(match.kickoff).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris"
                })}
              </p>
            )}
          </div>

          {/* Teams et Score */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2.5 flex-1">
              <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center
                              text-white font-bold text-[18px] [font-family:var(--font-display)]">
                {match.home_team_code.slice(0, 3)}
              </div>
              <span className="text-white text-[14px] font-semibold text-center line-clamp-2 leading-tight">{match.home_team}</span>
            </div>

            <div className="text-center px-3">
              {(isLive || isDone) ? (
                <span className="text-[48px] font-bold [font-family:var(--font-display)] text-white leading-none">
                  {match.home_score} – {match.away_score}
                </span>
              ) : (
                <span className="text-[40px] font-bold [font-family:var(--font-display)] text-white opacity-70 leading-none">
                  – –
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-2.5 flex-1">
              <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center
                              text-white font-bold text-[18px] [font-family:var(--font-display)]">
                {match.away_team_code.slice(0, 3)}
              </div>
              <span className="text-white text-[14px] font-semibold text-center line-clamp-2 leading-tight">{match.away_team}</span>
            </div>
          </div>

          {/* État Badge */}
          <div className="flex justify-center">
            {isLive && (
              <span className="flex items-center gap-[6px] px-4 py-2 rounded-full bg-[rgba(255,0,0,0.6)]
                               text-white text-[13px] font-bold animate-pulse">
                <span className="w-[6px] h-[6px] rounded-full bg-white animate-pulse" />
                EN DIRECT · {match.minute}
              </span>
            )}
            {isSoon && (
              <span className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.2)] text-white text-[13px] font-bold">
                À venir
              </span>
            )}
            {isDone && (
              <span className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.2)] text-white text-[13px] font-bold">
                Terminé
              </span>
            )}
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[rgba(255,255,255,0.12)] rounded-[12px] p-3.5 border border-[rgba(255,255,255,0.2)]">
              <p className="text-[12px] text-[rgba(255,255,255,0.8)] mb-1.5 font-semibold">Compétition</p>
              <p className="text-[13px] font-bold text-white">{match.competition_name || match.competition}</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.12)] rounded-[12px] p-3.5 border border-[rgba(255,255,255,0.2)]">
              <p className="text-[12px] text-[rgba(255,255,255,0.8)] mb-1.5 font-semibold">État</p>
              <p className="text-[13px] font-bold text-white">
                {isLive ? "EN DIRECT" : isDone ? "Terminé" : "À venir"}
              </p>
            </div>
          </div>

          {/* Form / Recent Results */}
          <div className="bg-[rgba(255,255,255,0.12)] rounded-[12px] p-3.5 border border-[rgba(255,255,255,0.2)]">
            <p className="text-[12px] text-[rgba(255,255,255,0.8)] mb-2.5 font-semibold">Forme récente</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-8 rounded-[6px] bg-[rgba(255,255,255,0.2)] flex items-center justify-center"
                >
                  <span className="text-[12px] font-bold text-white opacity-70">-</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        {/* End of content wrapper */}
      </div>

      {/* ── Right side: Tabs + Content ── */}
      <div className="flex-1 w-full md:w-[65%] flex flex-col bg-[var(--bg-1)]">
        {/* ── Tabs ── */}
        <div className="border-b border-[var(--border-light)] bg-[var(--bg-1)] md:bg-[var(--bg-2)] sticky top-0 z-10
                        overflow-x-auto flex scrollbar-none px-2 md:px-6 md:pt-6">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className={cn(
                "shrink-0 px-3 py-3 text-[13px] font-semibold transition-all duration-150 border-b-2 whitespace-nowrap",
                activeTab === i
                  ? "border-[var(--emerald-500)] text-[var(--emerald-500)]"
                  : "border-transparent text-[var(--fg-3)] hover:text-[var(--fg-2)]"
              )}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 px-4 md:px-6 pt-4 md:pb-6 overflow-y-auto">
          {match.is_premium ? (
            <PremiumLock label="Contenu Premium — Passe au Premium pour voir les cotes">
              <div className="opacity-30 pointer-events-none">
                {tabContent()}
              </div>
            </PremiumLock>
          ) : (
            tabContent()
          )}
        </div>

      </div>

      {/* ── Bet slip modal (sticky) ── */}
      <BetSlipModal />
    </div>
  )
}
