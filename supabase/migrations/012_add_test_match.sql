-- Add a test match for today with random odds
INSERT INTO matches (
  id,
  competition,
  competition_name,
  competition_color,
  home_team,
  away_team,
  home_team_code,
  away_team_code,
  state,
  kickoff,
  odds_1,
  odds_n,
  odds_2,
  created_at,
  updated_at
) VALUES (
  'test_' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'L1',
  'Ligue 1',
  '#4F46E5',
  'PSG',
  'Olympique Lyonnais',
  'PSG',
  'OL',
  'soon',
  NOW() + INTERVAL '6 hours',
  2.15,
  3.45,
  3.20,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
