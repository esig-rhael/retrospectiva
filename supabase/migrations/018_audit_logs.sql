create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create policy "masters read audit logs" on public.audit_logs for select using (public.current_user_role() = 'master');

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_payload jsonb;
  new_payload jsonb;
  target_id uuid;
begin
  old_payload := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_payload := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  target_id := coalesce((new_payload->>'id')::uuid, (old_payload->>'id')::uuid);
  insert into public.audit_logs(actor_id, action, entity, entity_id, old_data, new_data)
  values (auth.uid(), lower(TG_OP), TG_TABLE_NAME, target_id, old_payload, new_payload);
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_boards on public.boards;
create trigger audit_boards after insert or update or delete on public.boards for each row execute function public.write_audit_log();
drop trigger if exists audit_cards on public.cards;
create trigger audit_cards after insert or update or delete on public.cards for each row execute function public.write_audit_log();
drop trigger if exists audit_invites on public.board_invites;
create trigger audit_invites after insert or update or delete on public.board_invites for each row execute function public.write_audit_log();
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.write_audit_log();
