/**
 * Mapping des équipes de football (clubs et nations) vers codes pays ISO 2
 * Utilisé pour afficher les drapeaux appropriés
 */

// Nations - Coupe du Monde, Euro, Copa America, etc.
export const NATIONAL_TEAMS: Record<string, string> = {
  // Europe
  "France": "FR",
  "Germany": "DE",
  "Spain": "ES",
  "Italy": "IT",
  "England": "GB",
  "Portugal": "PT",
  "Netherlands": "NL",
  "Belgium": "BE",
  "Switzerland": "CH",
  "Austria": "AT",
  "Sweden": "SE",
  "Norway": "NO",
  "Denmark": "DK",
  "Finland": "FI",
  "Poland": "PL",
  "Czech Republic": "CZ",
  "Slovakia": "SK",
  "Hungary": "HU",
  "Romania": "RO",
  "Croatia": "HR",
  "Slovenia": "SI",
  "Greece": "GR",
  "Ukraine": "UA",
  "Russia": "RU",
  "Turkey": "TR",
  "Ireland": "IE",
  "Iceland": "IS",
  "Serbia": "RS",
  "Bosnia": "BA",
  "Montenegro": "ME",
  "Albania": "AL",
  "North Macedonia": "MK",
  "Bulgaria": "BG",
  "Moldova": "MD",
  "Georgia": "GE",
  "Armenia": "AM",
  "Azerbaijan": "AZ",
  "Belarus": "BY",
  "Lithuania": "LT",
  "Latvia": "LV",
  "Estonia": "EE",
  "Luxembourg": "LU",
  "Malta": "MT",
  "Cyprus": "CY",
  "Kosovo": "XK",
  "Wales": "GB",
  "Scotland": "GB",
  "Northern Ireland": "GB",

  // Americas
  "United States": "US",
  "USA": "US",
  "Canada": "CA",
  "Mexico": "MX",
  "Mexique": "MX",
  "Brazil": "BR",
  "Brésil": "BR",
  "Argentina": "AR",
  "Argentine": "AR",
  "Chile": "CL",
  "Chili": "CL",
  "Colombia": "CO",
  "Colombie": "CO",
  "Peru": "PE",
  "Pérou": "PE",
  "Uruguay": "UY",
  "Paraguay": "PY",
  "Venezuela": "VE",
  "Ecuador": "EC",
  "Équateur": "EC",
  "Bolivia": "BO",
  "Bolivie": "BO",
  "Costa Rica": "CR",
  "Honduras": "HN",
  "El Salvador": "SV",
  "Salvador": "SV",
  "Guatemala": "GT",
  "Panama": "PA",
  "Jamaica": "JM",
  "Jamaïque": "JM",
  "Trinidad and Tobago": "TT",
  "Trinité-et-Tobago": "TT",
  "Haiti": "HT",
  "Haïti": "HT",
  "Dominican Republic": "DO",
  "République Dominicaine": "DO",
  "Belize": "BZ",
  "Suriname": "SR",
  "Guyana": "GY",
  "Nicaragua": "NI",

  // Asia
  "China": "CN",
  "Japan": "JP",
  "South Korea": "KR",
  "North Korea": "KP",
  "India": "IN",
  "Thailand": "TH",
  "Malaysia": "MY",
  "Singapore": "SG",
  "Philippines": "PH",
  "Vietnam": "VN",
  "Indonesia": "ID",
  "Taiwan": "TW",
  "Hong Kong": "HK",
  "Bangladesh": "BD",
  "Pakistan": "PK",
  "Sri Lanka": "LK",
  "Iran": "IR",
  "Iraq": "IQ",
  "Saudi Arabia": "SA",
  "United Arab Emirates": "AE",
  "Qatar": "QA",
  "Kuwait": "KW",
  "Bahrain": "BH",
  "Oman": "OM",
  "Jordan": "JO",
  "Lebanon": "LB",
  "Syria": "SY",
  "Palestine": "PS",
  "Israel": "IL",
  "Afghanistan": "AF",

  // Africa
  "Egypt": "EG",
  "Morocco": "MA",
  "Tunisia": "TN",
  "Algeria": "DZ",
  "South Africa": "ZA",
  "Nigeria": "NG",
  "Ghana": "GH",
  "Kenya": "KE",
  "Cameroon": "CM",
  "Ivory Coast": "CI",
  "Côte d'Ivoire": "CI",
  "Cote d'Ivoire": "CI",
  "Senegal": "SN",
  "Sénégal": "SN",
  "Mali": "ML",
  "Burkina Faso": "BF",
  "Burkina": "BF",
  "Guinea": "GN",
  "Guinée": "GN",
  "Sierra Leone": "SL",
  "Liberia": "LR",
  "Benin": "BJ",
  "Bénin": "BJ",
  "Togo": "TG",
  "Ethiopia": "ET",
  "Éthiopie": "ET",
  "Uganda": "UG",
  "Ouganda": "UG",
  "Rwanda": "RW",
  "Tanzania": "TZ",
  "Tanzanie": "TZ",
  "Zimbabwe": "ZW",
  "Zambia": "ZM",
  "Zambie": "ZM",
  "Botswana": "BW",
  "Lesotho": "LS",
  "Namibia": "NA",
  "Namibie": "NA",
  "Angola": "AO",
  "Mozambique": "MZ",
  "Malawi": "MW",

  // Oceania
  "Australia": "AU",
  "New Zealand": "NZ",

  // Clubs de football - utiliser le pays de la ligue ou du siège
  "PSG": "FR",
  "Paris": "FR",
  "Lille": "FR",
  "Marseille": "FR",
  "Lyon": "FR",
  "Lens": "FR",
  "Nice": "FR",
  "Monaco": "FR",
  "Rennes": "FR",
  "Bordeaux": "FR",

  "Manchester United": "GB",
  "Manchester City": "GB",
  "Liverpool": "GB",
  "Arsenal": "GB",
  "Chelsea": "GB",
  "Tottenham": "GB",
  "Newcastle": "GB",
  "Brighton": "GB",

  "Real Madrid": "ES",
  "Barcelona": "ES",
  "Atletico Madrid": "ES",
  "Sevilla": "ES",
  "Valencia": "ES",
  "Villarreal": "ES",

  "Bayern Munich": "DE",
  "Borussia Dortmund": "DE",
  "Bayer Leverkusen": "DE",
  "RB Leipzig": "DE",
  "Schalke": "DE",
  "Union Berlin": "DE",

  "Juventus": "IT",
  "AC Milan": "IT",
  "Inter Milan": "IT",
  "Roma": "IT",
  "Napoli": "IT",
  "Lazio": "IT",
  "Fiorentina": "IT",
  "Atalanta": "IT",

  "Benfica": "PT",
  "Porto": "PT",
  "Sporting CP": "PT",

  "Ajax": "NL",
  "PSV": "NL",
  "Feyenoord": "NL",

  "Anderlecht": "BE",
  "Club Brugge": "BE",

  "Zurich": "CH",
  "Basel": "CH",
  "Young Boys": "CH",

  "Celtic": "GB",
  "Rangers": "GB",

  "Olympiacos": "GR",
  "AEK Athens": "GR",

  "Shakhtar Donetsk": "UA",
  "Dynamo Kyiv": "UA",

  "CSKA Moscow": "RU",
  "Spartak Moscow": "RU",

  "Galatasaray": "TR",
  "Fenerbahce": "TR",
  "Besiktas": "TR",
}

/**
 * Normalize team name for matching (remove accents, lowercase, trim)
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Remove accents
    .trim()
}

/**
 * Obtient le code pays pour une équipe
 */
export function getCountryCodeForTeam(teamName?: string): string | null {
  if (!teamName) return null

  // Exact match first
  if (NATIONAL_TEAMS[teamName]) {
    return NATIONAL_TEAMS[teamName]
  }

  // Normalized match (ignore accents and case)
  const normalizedInput = normalizeTeamName(teamName)
  for (const [key, code] of Object.entries(NATIONAL_TEAMS)) {
    if (normalizeTeamName(key) === normalizedInput) {
      return code
    }
  }

  return null
}

/**
 * Détecte si c'est un match international basé sur la compétition
 */
export function isInternationalCompetition(competition?: string): boolean {
  const internationalComps = ["CDM", "EUR", "COPA", "AFCON", "ACN", "GOLD", "CONMEBOL"]
  return competition ? internationalComps.some(c => competition.includes(c)) : false
}
