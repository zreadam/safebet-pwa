/**
 * Team logo utilities
 * Fetch and cache team logos from API
 */

interface TeamLogo {
  id: number
  team_name: string
  team_code: string | null
  logo_url: string | null
}

// In-memory cache for team logos (avoid repeated API calls)
const logoCache = new Map<string, TeamLogo | null>()

const DEFAULT_TEAM_ICON = "⚽" // Fallback when logo not found

/**
 * Get logo URL for a team by name or code
 * Uses in-memory cache to avoid repeated API calls
 */
export async function getTeamLogo(
  teamNameOrCode: string,
  isCode = false
): Promise<string | null> {
  const cacheKey = `${isCode ? "code" : "name"}:${teamNameOrCode.toLowerCase()}`

  // Check cache first
  if (logoCache.has(cacheKey)) {
    const cached = logoCache.get(cacheKey)
    return cached?.logo_url || null
  }

  try {
    const params = new URLSearchParams(
      isCode
        ? { code: teamNameOrCode }
        : { name: teamNameOrCode }
    )

    const response = await fetch(`/api/teams/logo?${params}`, {
      cache: "force-cache", // Cache responses for 24h by default
    })

    if (!response.ok) {
      logoCache.set(cacheKey, null)
      return null
    }

    const data: TeamLogo = await response.json()
    logoCache.set(cacheKey, data)
    return data.logo_url || null
  } catch (error) {
    console.error(`Failed to fetch logo for ${teamNameOrCode}:`, error)
    logoCache.set(cacheKey, null)
    return null
  }
}

/**
 * Get multiple team logos in parallel
 */
export async function getTeamLogos(teams: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()
  const promises = teams.map(async (team) => {
    const logo = await getTeamLogo(team)
    results.set(team, logo)
  })

  await Promise.all(promises)
  return results
}

/**
 * Clear logo cache (useful for testing or manual refresh)
 */
export function clearLogos() {
  logoCache.clear()
}

/**
 * Get cached logo without API call (returns null if not cached)
 */
export function getCachedLogo(teamNameOrCode: string, isCode = false): string | null {
  const cacheKey = `${isCode ? "code" : "name"}:${teamNameOrCode.toLowerCase()}`
  const cached = logoCache.get(cacheKey)
  return cached?.logo_url || null
}
