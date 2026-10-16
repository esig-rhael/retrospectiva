-- Permite mover cards entre colunas e agrupá-los sem alterar sua autoria.
alter table public.cards add column if not exists group_id uuid references public.cards(id) on delete set null;

create or replace function public.prevent_card_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.author_id is distinct from old.author_id then
    raise exception 'card author cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_card_identity on public.cards;
create trigger protect_card_identity
before update on public.cards
for each row execute function public.prevent_card_identity_change();

drop policy if exists "owners or authors update cards" on public.cards;
create policy "owners or authors update cards" on public.cards
for update using (
  exists (
    select 1 from public.board_columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and (b.owner_id = auth.uid() or cards.author_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.board_columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and (b.owner_id = auth.uid() or public.is_board_invited(b.id))
  )
);

