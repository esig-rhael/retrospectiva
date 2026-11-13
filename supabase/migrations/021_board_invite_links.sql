create table if not exists public.board_invite_links (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  token_hash text not null unique,
  role text not null default 'participante' check (role in ('gestor','participante')),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.board_invite_links enable row level security;
create policy "managers read invite links" on public.board_invite_links for select using (public.is_board_manager(board_id));

