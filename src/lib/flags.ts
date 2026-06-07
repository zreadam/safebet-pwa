/**
 * Mapping of country codes to flag emoji and paths
 * Supports ISO 2-letter country codes (alpha-2)
 */

export const COUNTRY_CODES: Record<string, { name: string; flag: string }> = {
  // European countries
  FR: { name: "France", flag: "/flags/fr.png" },
  DE: { name: "Germany", flag: "/flags/de.png" },
  ES: { name: "Spain", flag: "/flags/es.png" },
  IT: { name: "Italy", flag: "/flags/it.png" },
  PT: { name: "Portugal", flag: "/flags/pt.png" },
  GB: { name: "United Kingdom", flag: "/flags/gb.png" },
  NL: { name: "Netherlands", flag: "/flags/nl.png" },
  BE: { name: "Belgium", flag: "/flags/be.png" },
  CH: { name: "Switzerland", flag: "/flags/ch.png" },
  AT: { name: "Austria", flag: "/flags/at.png" },
  SE: { name: "Sweden", flag: "/flags/se.png" },
  NO: { name: "Norway", flag: "/flags/no.png" },
  DK: { name: "Denmark", flag: "/flags/dk.png" },
  FI: { name: "Finland", flag: "/flags/fi.png" },
  PL: { name: "Poland", flag: "/flags/pl.png" },
  CZ: { name: "Czech Republic", flag: "/flags/cz.png" },
  SK: { name: "Slovakia", flag: "/flags/sk.png" },
  HU: { name: "Hungary", flag: "/flags/hu.png" },
  RO: { name: "Romania", flag: "/flags/ro.png" },
  HR: { name: "Croatia", flag: "/flags/hr.png" },
  SI: { name: "Slovenia", flag: "/flags/si.png" },
  GR: { name: "Greece", flag: "/flags/gr.png" },
  UA: { name: "Ukraine", flag: "/flags/ua.png" },
  RU: { name: "Russia", flag: "/flags/ru.png" },
  TR: { name: "Turkey", flag: "/flags/tr.png" },
  IE: { name: "Ireland", flag: "/flags/ie.png" },
  IS: { name: "Iceland", flag: "/flags/is.png" },

  // Americas
  US: { name: "United States", flag: "/flags/us.png" },
  CA: { name: "Canada", flag: "/flags/ca.png" },
  MX: { name: "Mexico", flag: "/flags/mx.png" },
  BR: { name: "Brazil", flag: "/flags/br.png" },
  AR: { name: "Argentina", flag: "/flags/ar.png" },
  CL: { name: "Chile", flag: "/flags/cl.png" },
  CO: { name: "Colombia", flag: "/flags/co.png" },
  PE: { name: "Peru", flag: "/flags/pe.png" },
  UY: { name: "Uruguay", flag: "/flags/uy.png" },
  PY: { name: "Paraguay", flag: "/flags/py.png" },
  VE: { name: "Venezuela", flag: "/flags/ve.png" },
  EC: { name: "Ecuador", flag: "/flags/ec.png" },
  BO: { name: "Bolivia", flag: "/flags/bo.png" },

  // Asia
  CN: { name: "China", flag: "/flags/cn.png" },
  JP: { name: "Japan", flag: "/flags/jp.png" },
  KR: { name: "South Korea", flag: "/flags/kr.png" },
  KP: { name: "North Korea", flag: "/flags/kp.png" },
  IN: { name: "India", flag: "/flags/in.png" },
  TH: { name: "Thailand", flag: "/flags/th.png" },
  MY: { name: "Malaysia", flag: "/flags/my.png" },
  SG: { name: "Singapore", flag: "/flags/sg.png" },
  PH: { name: "Philippines", flag: "/flags/ph.png" },
  VN: { name: "Vietnam", flag: "/flags/vn.png" },
  ID: { name: "Indonesia", flag: "/flags/id.png" },
  TW: { name: "Taiwan", flag: "/flags/tw.png" },
  HK: { name: "Hong Kong", flag: "/flags/hk.png" },
  MO: { name: "Macau", flag: "/flags/mo.png" },
  BD: { name: "Bangladesh", flag: "/flags/bd.png" },
  PK: { name: "Pakistan", flag: "/flags/pk.png" },
  LK: { name: "Sri Lanka", flag: "/flags/lk.png" },

  // Middle East & Africa
  SA: { name: "Saudi Arabia", flag: "/flags/sa.png" },
  AE: { name: "United Arab Emirates", flag: "/flags/ae.png" },
  QA: { name: "Qatar", flag: "/flags/qa.png" },
  KW: { name: "Kuwait", flag: "/flags/kw.png" },
  BH: { name: "Bahrain", flag: "/flags/bh.png" },
  OM: { name: "Oman", flag: "/flags/om.png" },
  IQ: { name: "Iraq", flag: "/flags/iq.png" },
  IR: { name: "Iran", flag: "/flags/ir.png" },
  JO: { name: "Jordan", flag: "/flags/jo.png" },
  IL: { name: "Israel", flag: "/flags/il.png" },
  PS: { name: "Palestine", flag: "/flags/ps.png" },
  LB: { name: "Lebanon", flag: "/flags/lb.png" },
  SY: { name: "Syria", flag: "/flags/sy.png" },
  EG: { name: "Egypt", flag: "/flags/eg.png" },
  MA: { name: "Morocco", flag: "/flags/ma.png" },
  TN: { name: "Tunisia", flag: "/flags/tn.png" },
  DZ: { name: "Algeria", flag: "/flags/dz.png" },
  ZA: { name: "South Africa", flag: "/flags/za.png" },
  NG: { name: "Nigeria", flag: "/flags/ng.png" },
  GH: { name: "Ghana", flag: "/flags/gh.png" },
  KE: { name: "Kenya", flag: "/flags/ke.png" },

  // Oceania & Others
  AU: { name: "Australia", flag: "/flags/au.png" },
  NZ: { name: "New Zealand", flag: "/flags/nz.png" },
}

/**
 * Get flag path for a country code
 */
export function getFlagPath(countryCode?: string): string {
  if (!countryCode) return "/flags/unknown.png"
  const upper = countryCode.toUpperCase()
  return COUNTRY_CODES[upper]?.flag || "/flags/unknown.png"
}

/**
 * Get country name for a country code
 */
export function getCountryName(countryCode?: string): string {
  if (!countryCode) return "Unknown"
  const upper = countryCode.toUpperCase()
  return COUNTRY_CODES[upper]?.name || "Unknown"
}
