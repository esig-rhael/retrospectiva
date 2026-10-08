alter table public.boards add column if not exists cards_revealed boolean not null default false;
update public.boards set cards_revealed = true where id = '00000000-0000-0000-0000-000000000001';
create policy "owners update reveal state" on public.boards for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
