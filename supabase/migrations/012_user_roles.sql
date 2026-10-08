create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, role text not null default 'participante' check (role in ('master', 'gestor', 'participante')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;
create policy "users read own profile" on public.profiles for select using (id = auth.uid() or public.current_user_role() = 'master');
create policy "master update profiles" on public.profiles for update using (public.current_user_role() = 'master') with check (role in ('master', 'gestor', 'participante'));
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do update set email = excluded.email; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
insert into public.profiles (id, email) select id, email from auth.users on conflict (id) do update set email = excluded.email;
update public.profiles set role = 'master' where lower(email) = lower('rhael.henrique@esig.com.br');
