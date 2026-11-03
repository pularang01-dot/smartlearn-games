-- =====================================================================
-- SmartLearn Games — 0003: Storage bucket 'game-assets'
-- Bucket publik (gambar dapat tampil di halaman share tanpa login) dengan nama file
-- acak. Tulis/ubah/hapus HANYA di folder milik sendiri: <user_id>/...
-- Tidak ada policy SELECT publik pada storage.objects => daftar file tidak bisa di-list oleh anon.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-assets', 'game-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "game_assets_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'game-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "game_assets_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'game-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "game_assets_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'game-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'game-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "game_assets_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'game-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
