-- Create increment_quest function for quest progress tracking
CREATE OR REPLACE FUNCTION increment_quest(
  p_user_id UUID,
  p_quest_key TEXT,
  p_period TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_daily integer := 5;  -- Default for daily quests
  v_total_weekly integer := 7; -- Default for weekly quests
  v_total_progression integer := 1; -- Default for progression quests
BEGIN
  -- Get the target total based on quest type and user tier
  -- For daily_bets: free=5, premium=2
  -- For other daily quests: adjust as needed

  INSERT INTO quest_progress (user_id, quest_key, period_key, progress, is_done)
  VALUES (p_user_id, p_quest_key, p_period, 1, false)
  ON CONFLICT (user_id, quest_key, period_key) DO UPDATE SET
    progress = LEAST(quest_progress.progress + 1,
      CASE
        WHEN p_quest_key = 'daily_bets' THEN 5
        WHEN p_quest_key = 'daily_combi' THEN 4
        WHEN p_quest_key = 'daily_live' THEN 3
        WHEN p_quest_key = 'daily_win' THEN 3
        WHEN p_quest_key = 'daily_login' THEN 1
        WHEN p_quest_key = 'weekly_streak' THEN 7
        WHEN p_quest_key = 'weekly_combi' THEN 5
        WHEN p_quest_key = 'weekly_wins' THEN 5
        WHEN p_quest_key = 'weekly_explorer' THEN 5
        ELSE 100
      END
    ),
    is_done = CASE
      WHEN (quest_progress.progress + 1) >=
        CASE
          WHEN p_quest_key = 'daily_bets' THEN 5
          WHEN p_quest_key = 'daily_combi' THEN 4
          WHEN p_quest_key = 'daily_live' THEN 3
          WHEN p_quest_key = 'daily_win' THEN 3
          WHEN p_quest_key = 'daily_login' THEN 1
          WHEN p_quest_key = 'weekly_streak' THEN 7
          WHEN p_quest_key = 'weekly_combi' THEN 5
          WHEN p_quest_key = 'weekly_wins' THEN 5
          WHEN p_quest_key = 'weekly_explorer' THEN 5
          ELSE 100
        END
      THEN true
      ELSE quest_progress.is_done
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_quest(uuid, text, text) TO authenticated, service_role, anon;
