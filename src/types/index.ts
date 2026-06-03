export type MatchState = "live" | "soon" | "done"
export type BetStatus = "pending" | "won" | "lost" | "void"
export type UserTier = "free" | "premium"

export interface Profile {
  id: string
  username: string
  avatar_url?: string
  avatar_color?: string
  country: string
  favorite_team?: string
  favorite_competitions: string[]
  balance: number
  tier: UserTier
  streak: number
  total_bets: number
  won_bets?: number
  win_rate: number
  onboarding_done: boolean
  stripe_customer_id?: string
  created_at: string
}

export interface Match {
  id: string
  competition: string
  competition_name: string
  competition_color: string
  home_team: string
  away_team: string
  home_team_code: string
  away_team_code: string
  home_score?: number
  away_score?: number
  state: MatchState
  kickoff: string
  minute?: string
  venue?: string
  odds_1: number
  odds_n: number
  odds_2: number
  is_premium: boolean
}

export interface OddsMarket {
  key: string
  label: string
  outcomes: { key: string; label: string; price: number }[]
}

export interface Bet {
  id: string
  user_id: string
  match_id: string
  match_label: string
  market: string
  selection: string
  odds: number
  stake: number
  potential_gain: number
  status: BetStatus
  placed_at: string
  settled_at?: string
  is_live: boolean
}

export interface League {
  id: string
  name: string
  color: string
  emoji?: string
  is_private: boolean
  created_by: string
  invite_code?: string
  member_count: number
  members: LeagueMember[]
  activity: ActivityItem[]
}

export interface LeagueMember {
  user_id: string
  username: string
  avatar_color: string
  rank: number
  balance: number
  balance_change: number
  is_me?: boolean
}

export interface ActivityItem {
  text: string
  emoji: string
  created_at: string
}

export interface Quest {
  id: string
  key: string
  title: string
  description: string
  reward: number
  type: "daily" | "weekly" | "progression"
  progress: number
  total: number
  is_done: boolean
  is_premium: boolean
  reset_in?: string
}
