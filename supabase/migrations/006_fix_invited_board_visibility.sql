create or replace function public.is_board_invited(target_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.board_invites i
    where i.board_id = target_board_id
      and lower(trim(i.email)) = lower(trim(auth.jwt()->>'email'))
  );
$$;
grant execute on function public.is_board_invited(uuid) to authenticated;

drop policy if exists "users read own or invited boards" on public.boards;
create policy "users read own or invited boards" on public.boards for select using (owner_id = auth.uid() or public.is_board_invited(id));

drop policy if exists "users read own or invited columns" on public.board_columns;
create policy "users read own or invited columns" on public.board_columns for select using (exists (select 1 from public.boards b where b.id = board_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));

drop policy if exists "users read own or invited cards" on public.cards;
create policy "users read own or invited cards" on public.cards for select using (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));

drop policy if exists "owners and invitees create cards" on public.cards;
create policy "owners and invitees create cards" on public.cards for insert with check (exists (select 1 from public.board_columns c join public.boards b on b.id = c.board_id where c.id = column_id and (b.owner_id = auth.uid() or public.is_board_invited(b.id))));
