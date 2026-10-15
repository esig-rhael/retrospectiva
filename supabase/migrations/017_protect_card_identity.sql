-- Cards podem ter o conteúdo editado, mas não podem ser movidos
-- ou ter sua autoria alterada depois da criação.
create or replace function public.prevent_card_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.column_id is distinct from old.column_id then
    raise exception 'card column cannot be changed';
  end if;
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
