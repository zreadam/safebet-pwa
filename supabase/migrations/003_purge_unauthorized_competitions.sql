-- ============================================================
-- Migration 003 — Purge des compétitions non autorisées
-- ============================================================
-- Seules ces 28 compétitions sont autorisées sur la plateforme.
-- Tout match dont le code `competition` ne figure pas dans cette
-- liste est supprimé de la table `matches` — SAUF s'il a des paris.
--
-- Codes autorisés :
--   Ligues    : L1, PL, LIGA, BL, SA, ERE, LPT, STL
--   Coupes    : CDRF, FAC, CC, CDR, SCES, DFBP, CI, SCIT, TRCH
--   UEFA      : UCL, EL, ECL
--   Mondial   : CDM, EURO, NL, CAN, LIB, CWC, CA, CIC
-- ============================================================

DELETE FROM matches
WHERE competition NOT IN (
  -- Ligues nationales
  'L1', 'PL', 'LIGA', 'BL', 'SA', 'ERE', 'LPT', 'STL',
  -- Coupes nationales
  'CDRF', 'FAC', 'CC', 'CDR', 'SCES', 'DFBP', 'CI', 'SCIT', 'TRCH',
  -- UEFA
  'UCL', 'EL', 'ECL',
  -- Compétitions mondiales
  'CDM', 'EURO', 'NL', 'CAN', 'LIB', 'CWC', 'CA', 'CIC'
)
AND id NOT IN (SELECT DISTINCT match_id FROM bets);
