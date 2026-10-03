drop policy if exists "users read own boards" on public.boards;
drop policy if exists "users read own columns" on public.board_columns;
drop policy if exists "users read own cards" on public.cards;
drop policy if exists "users create own columns" on public.board_columns;
drop policy if exists "users create own cards" on public.cards;

create policy "users read own boards" on public.boards for select using (owner_id = auth.uid());
create policy "users read own columns" on public.board_columns for select using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
create policy "users create own columns" on public.board_columns for insert with check (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
create policy "users read own cards" on public.cards for select using (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and b.owner_id = auth.uid()));
create policy "users create own cards" on public.cards for insert with check (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and b.owner_id = auth.uid()));
