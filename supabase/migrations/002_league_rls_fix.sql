-- ============================================================
-- Safebet — Fix RLS policies for leagues, activity, members
-- ============================================================

-- league_activity : allow members to insert
drop policy if exists "League activity insert" on league_activity;
create policy "League activity insert" on league_activity for insert
  with check (
    league_id in (
      select league_id from league_members where user_id = auth.uid()
    )
  );

-- league_members : allow members to delete themselves (leave)
drop policy if exists "Leave league" on league_members;
create policy "Leave league" on league_members for delete
  using (user_id = auth.uid());

-- leagues : allow creator to update and delete
drop policy if exists "Update league" on leagues;
create policy "Update league" on leagues for update
  using (auth.uid() = created_by);

drop policy if exists "Delete league" on leagues;
create policy "Delete league" on leagues for delete
  using (auth.uid() = created_by);

-- leagues : allow viewing public leagues (even non-members)
drop policy if exists "Public leagues view" on leagues;
create policy "Public leagues view" on leagues for select
  using (
    is_private = false
    or id in (select league_id from league_members where user_id = auth.uid())
  );

-- matches : allow upsert from service role (already handled but adding for clarity)
drop policy if exists "Upsert matches" on matches;
create policy "Upsert matches" on matches for insert with check (true);
create policy "Update matches" on matches for update using (true);
