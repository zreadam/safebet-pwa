-- Fonction RPC pour charger les matchs amicaux
-- Accessible sans SERVICE_ROLE_KEY

CREATE OR REPLACE FUNCTION load_amical_matches(
  p_matches jsonb
)
RETURNS TABLE (
  inserted_count bigint
) AS $$
DECLARE
  v_match jsonb;
  v_inserted bigint := 0;
BEGIN
  -- Parcourir chaque match dans le JSON
  FOR v_match IN SELECT jsonb_array_elements(p_matches)
  LOOP
    INSERT INTO public.matches (
      id,
      competition,
      competition_name,
      competition_color,
      home_team,
      away_team,
      home_team_code,
      away_team_code,
      home_score,
      away_score,
      state,
      kickoff,
      minute,
      odds_1,
      odds_n,
      odds_2,
      odds_updated_at,
      is_premium,
      created_at,
      updated_at
    )
    VALUES (
      v_match->>'id',
      v_match->>'competition',
      v_match->>'competition_name',
      v_match->>'competition_color',
      v_match->>'home_team',
      v_match->>'away_team',
      v_match->>'home_team_code',
      v_match->>'away_team_code',
      (v_match->>'home_score')::int,
      (v_match->>'away_score')::int,
      v_match->>'state',
      (v_match->>'kickoff')::timestamptz,
      v_match->>'minute',
      (v_match->>'odds_1')::numeric,
      (v_match->>'odds_n')::numeric,
      (v_match->>'odds_2')::numeric,
      (v_match->>'odds_updated_at')::timestamptz,
      (v_match->>'is_premium')::boolean,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      state = EXCLUDED.state,
      minute = EXCLUDED.minute,
      odds_1 = EXCLUDED.odds_1,
      odds_n = EXCLUDED.odds_n,
      odds_2 = EXCLUDED.odds_2,
      odds_updated_at = EXCLUDED.odds_updated_at,
      updated_at = NOW();
    
    v_inserted := v_inserted + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner accès public à la fonction
GRANT EXECUTE ON FUNCTION load_amical_matches(jsonb) TO anon, authenticated;
