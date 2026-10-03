alter table public.cards add column if not exists author_id uuid references auth.users(id) on delete set null;
drop policy if exists "owners and invitees update cards" on public.cards;
drop policy if exists "owners and invitees delete cards" on public.cards;
drop policy if exists "owners and invitees create cards" on public.cards;
create policy "members create cards with author" on public.cards for insert with check (author_id = auth.uid() and exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));
create policy "owners or authors update cards" on public.cards for update using (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or author_id = auth.uid()))) with check (true);
create policy "owners or authors delete cards" on public.cards for delete using (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or author_id = auth.uid())));
