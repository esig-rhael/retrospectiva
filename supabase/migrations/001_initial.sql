create extension if not exists pgcrypto;

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(), title text not null, created_at timestamptz not null default now()
);
create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(), board_id uuid not null references public.boards(id) on delete cascade,
  title text not null, position integer not null, created_at timestamptz not null default now()
);
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(), column_id uuid not null references public.board_columns(id) on delete cascade,
  content text not null check (length(trim(content)) > 0), created_at timestamptz not null default now()
);
alter table public.boards enable row level security; alter table public.board_columns enable row level security; alter table public.cards enable row level security;
create policy "public read boards" on public.boards for select using (true); create policy "public read columns" on public.board_columns for select using (true); create policy "public read cards" on public.cards for select using (true); create policy "public insert cards" on public.cards for insert with check (true);
insert into public.boards (id, title) values ('00000000-0000-0000-0000-000000000001', 'Retrospectiva') on conflict (id) do nothing;
insert into public.board_columns (board_id, title, position) select '00000000-0000-0000-0000-000000000001', title, position from (values ('O que deu certo', 1), ('O que não deu certo', 2), ('Melhorar', 3), ('Planos de Ação', 4)) v(title, position) where not exists (select 1 from public.board_columns where board_id = '00000000-0000-0000-0000-000000000001');
alter table public.cards replica identity full;
alter publication supabase_realtime add table public.cards;
