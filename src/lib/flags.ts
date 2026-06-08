/**
 * Get flag path for a country code (ISO 2-letter codes)
 * Uses high-quality 256x256 PNG flags from w2560 collection
 */
export function getFlagPath(countryCode?: string): string {
  if (!countryCode) return "/flags/unknown.png"
  const lower = countryCode.toLowerCase()
  return `/flags/${lower}.png`
}

/**
 * Get country name for a country code
 * Note: Limited to common countries for now
 */
export function getCountryName(countryCode?: string): string {
  if (!countryCode) return "Unknown"

  const countryNames: Record<string, string> = {
    // Common countries
    FR: "France",
    DE: "Germany",
    ES: "Spain",
    IT: "Italy",
    GB: "United Kingdom",
    PT: "Portugal",
    NL: "Netherlands",
    BE: "Belgium",
    CH: "Switzerland",
    AT: "Austria",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    PL: "Poland",
    CZ: "Czech Republic",
    SK: "Slovakia",
    HU: "Hungary",
    RO: "Romania",
    HR: "Croatia",
    GR: "Greece",
    UA: "Ukraine",
    RU: "Russia",
    TR: "Turkey",
    US: "United States",
    CA: "Canada",
    MX: "Mexico",
    BR: "Brazil",
    AR: "Argentina",
    CL: "Chile",
    CO: "Colombia",
    PE: "Peru",
    UY: "Uruguay",
    CN: "China",
    JP: "Japan",
    KR: "South Korea",
    IN: "India",
    TH: "Thailand",
    MY: "Malaysia",
    SG: "Singapore",
    VN: "Vietnam",
    ID: "Indonesia",
    PH: "Philippines",
    SA: "Saudi Arabia",
    AE: "United Arab Emirates",
    EG: "Egypt",
    ZA: "South Africa",
    NG: "Nigeria",
    AU: "Australia",
    NZ: "New Zealand",
  }

  const upper = countryCode.toUpperCase()
  return countryNames[upper] || countryCode.toUpperCase()
}
