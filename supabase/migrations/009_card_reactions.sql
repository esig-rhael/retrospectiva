create table if not exists public.card_reactions (
  id uuid primary key default gen_random_uuid(), card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(),
  unique(card_id, user_id)
);
alter table public.card_reactions enable row level security;
create policy "members read reactions" on public.card_reactions for select using (exists (select 1 from public.cards x join public.board_columns c on c.id = x.column_id join public.boards b on b.id = c.board_id where x.id = card_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));
create policy "members create own reactions" on public.card_reactions for insert with check (user_id = auth.uid() and exists (select 1 from public.cards x join public.board_columns c on c.id = x.column_id join public.boards b on b.id = c.board_id where x.id = card_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));
create policy "users delete own reactions" on public.card_reactions for delete using (user_id = auth.uid());
alter table public.card_reactions replica identity full;
alter publication supabase_realtime add table public.card_reactions;
