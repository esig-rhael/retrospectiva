-- Impede que alterações normais de usuário troquem o proprietário de um board.
-- A propriedade continua definida apenas na criação do board.
create or replace function public.prevent_board_owner_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'board owner cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_board_owner on public.boards;
create trigger protect_board_owner
before update on public.boards
for each row execute function public.prevent_board_owner_change();
