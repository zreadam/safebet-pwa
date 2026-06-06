/**
 * Configuration des adresses e-mail Safebet
 */

export const EMAILS = {
  // Adresse principale de contact
  HELLO: 'safebet.support@gmail.com',
  
  // Support client
  SUPPORT: 'safebet.support@gmail.com',
  
  // Emails automatisés (ne pas répondre)
  NOREPLY: 'safebet.support@gmail.com',
  
  // Newsletter et communications
  NEWSLETTER: 'safebet.support@gmail.com',
  
  // Partenariats B2B
  PARTNERSHIPS: 'safebet.support@gmail.com',
} as const

// Adresse par défaut pour les formulaires de contact
export const DEFAULT_CONTACT_EMAIL = EMAILS.HELLO

// Email pour les erreurs critiques
export const ERROR_EMAIL = EMAILS.SUPPORT
