create policy "owners delete boards" on public.boards for delete using (owner_id = auth.uid());
