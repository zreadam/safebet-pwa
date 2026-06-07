-- Fix increment_quest function to use correct quest keys
DROP FUNCTION IF EXISTS increment_quest(uuid, text, text) CASCADE;

CREATE OR REPLACE FUNCTION increment_quest(
  p_user_id UUID,
  p_quest_key TEXT,
  p_period TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update quest progress
  INSERT INTO quest_progress (user_id, quest_key, period_key, progress, is_done)
  VALUES (p_user_id, p_quest_key, p_period, 1, false)
  ON CONFLICT (user_id, quest_key, period_key) DO UPDATE SET
    progress = quest_progress.progress + 1,
    updated_at = NOW(),
    is_done = CASE
      WHEN (quest_progress.progress + 1) >= (
        CASE
          WHEN p_quest_key = 'daily_bets' THEN 5
          WHEN p_quest_key = 'daily_first_bet' THEN 1
          WHEN p_quest_key = 'daily_streak' THEN 3
          WHEN p_quest_key = 'daily_live_bet' THEN 1
          WHEN p_quest_key = 'daily_premium_bet' THEN 1
          WHEN p_quest_key = 'weekly_5_bets' THEN 5
          WHEN p_quest_key = 'weekly_win_3' THEN 3
          WHEN p_quest_key = 'weekly_premium_combo' THEN 2
          WHEN p_quest_key = 'prog_10_bets' THEN 10
          WHEN p_quest_key = 'prog_50_bets' THEN 50
          WHEN p_quest_key = 'prog_league' THEN 1
          ELSE 999
        END
      ) THEN true
      ELSE quest_progress.is_done
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_quest(uuid, text, text) TO authenticated, service_role, anon;
