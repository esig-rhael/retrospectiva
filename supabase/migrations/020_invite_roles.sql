alter table public.board_invites
  add column if not exists role text not null default 'participante'
  check (role in ('gestor', 'participante'));

create or replace function public.is_board_manager(target_board_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.boards b
    where b.id = target_board_id and b.owner_id = auth.uid()
  ) or exists (
    select 1 from public.board_invites i
    where i.board_id = target_board_id
      and i.role = 'gestor'
      and lower(trim(i.email)) = lower(trim(auth.jwt()->>'email'))
  );
$$;
grant execute on function public.is_board_manager(uuid) to authenticated;

drop policy if exists "owners create invites" on public.board_invites;
create policy "owners and managers create invites" on public.board_invites
for insert with check (
  invited_by = auth.uid() and public.is_board_manager(board_id)
);

drop policy if exists "owners remove invites" on public.board_invites;
create policy "owners and managers remove invites" on public.board_invites
for delete using (public.is_board_manager(board_id));

drop policy if exists "owners and invited managers update boards" on public.boards;
create policy "owners and invited managers update boards" on public.boards
for update using (public.is_board_manager(id)) with check (owner_id = owner_id);

drop policy if exists "owners and invited managers update columns" on public.board_columns;
create policy "owners and invited managers update columns" on public.board_columns
for update using (public.is_board_manager(board_id));

drop policy if exists "owners delete boards" on public.boards;
create policy "owners delete boards" on public.boards
for delete using (owner_id = auth.uid());

