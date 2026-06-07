-- Add bet_group_id column to bets table for combo bet grouping
-- This migration safely adds the column if it doesn't exist
alter table if exists bets add column if not exists bet_group_id text;

-- Create index for faster filtering by group
create index if not exists idx_bets_bet_group_id on bets(bet_group_id);
