alter publication supabase_realtime add table public.boards;
alter table public.boards replica identity full;
update public.boards set cards_revealed = false;
