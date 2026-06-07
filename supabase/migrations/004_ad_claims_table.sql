-- ============================================================
-- Migration 004 — Table des revendications de publicités
-- ============================================================
-- Enregistre quand les utilisateurs regardent des publicités
-- pour gagner des bluffs et limite les abus.

CREATE TABLE IF NOT EXISTS ad_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bluffs INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes de rate-limiting (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_ad_claims_user_date
ON ad_claims(user_id, created_at DESC);

-- Politique RLS : les utilisateurs ne voient que leurs propres claims
ALTER TABLE ad_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_ad_claims" ON ad_claims;
CREATE POLICY "users_view_own_ad_claims"
ON ad_claims FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_ad_claims" ON ad_claims;
CREATE POLICY "users_insert_own_ad_claims"
ON ad_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);
