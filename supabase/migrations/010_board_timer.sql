create table if not exists public.board_timers (
  board_id uuid primary key references public.boards(id) on delete cascade,
  duration_seconds integer not null default 300 check (duration_seconds between 10 and 7200),
  ends_at timestamptz,
  running boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.board_timers enable row level security;
create policy "members read timers" on public.board_timers for select using (exists (select 1 from public.boards b where b.id = board_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));
create policy "owners insert timers" on public.board_timers for insert with check (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
create policy "owners update timers" on public.board_timers for update using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
alter table public.board_timers replica identity full;
alter publication supabase_realtime add table public.board_timers;
