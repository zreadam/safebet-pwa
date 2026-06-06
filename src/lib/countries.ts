/**
 * Codes pays ISO 3166-1 alpha-2
 * Utiliser avec le composant <CountryFlag>
 */

export const COUNTRY_CODES = {
  // France
  FR: 'fr',
  // Espagne
  ES: 'es',
  // Italie
  IT: 'it',
  // Allemagne
  DE: 'de',
  // Angleterre
  GB: 'gb',
  // Portugal
  PT: 'pt',
  // Pays-Bas
  NL: 'nl',
  // Turquie
  TR: 'tr',
  // Brésil
  BR: 'br',
  // Argentine
  AR: 'ar',
  // Uruguay
  UY: 'uy',
  // Colombie
  CO: 'co',
  // Pérou
  PE: 'pe',
  // Chili
  CL: 'cl',
} as const

export type CountryCode = typeof COUNTRY_CODES[keyof typeof COUNTRY_CODES]
