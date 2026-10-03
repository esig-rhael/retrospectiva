create table if not exists public.board_invites (
  id uuid primary key default gen_random_uuid(), board_id uuid not null references public.boards(id) on delete cascade,
  email text not null, invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), unique(board_id, email)
);
alter table public.board_invites enable row level security;
create policy "owners create invites" on public.board_invites for insert with check (invited_by = auth.uid() and exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
create policy "invitees read invites" on public.board_invites for select using (lower(email) = lower(auth.jwt()->>'email') or invited_by = auth.uid());

drop policy if exists "users read own boards" on public.boards;
create policy "users read own or invited boards" on public.boards for select using (owner_id = auth.uid() or exists (select 1 from public.board_invites i where i.board_id = id and lower(i.email) = lower(auth.jwt()->>'email')));
drop policy if exists "users read own columns" on public.board_columns;
create policy "users read own or invited columns" on public.board_columns for select using (exists (select 1 from public.boards b where b.id = board_id and (b.owner_id = auth.uid() or exists (select 1 from public.board_invites i where i.board_id = b.id and lower(i.email) = lower(auth.jwt()->>'email')))));
drop policy if exists "users read own cards" on public.cards;
create policy "users read own or invited cards" on public.cards for select using (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or exists (select 1 from public.board_invites i where i.board_id = b.id and lower(i.email) = lower(auth.jwt()->>'email')))));
drop policy if exists "users create own columns" on public.board_columns;
create policy "owners create columns" on public.board_columns for insert with check (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
drop policy if exists "users create own cards" on public.cards;
create policy "owners and invitees create cards" on public.cards for insert with check (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or exists (select 1 from public.board_invites i where i.board_id = b.id and lower(i.email) = lower(auth.jwt()->>'email')))));
