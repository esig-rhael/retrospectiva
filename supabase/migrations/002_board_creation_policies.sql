create policy "public insert boards" on public.boards for insert with check (true);
create policy "public insert columns" on public.board_columns for insert with check (true);
