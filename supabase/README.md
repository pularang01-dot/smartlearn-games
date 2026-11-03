# Folder `supabase/`

- `migrations/0001_schema.sql` — tabel, constraint, indeks, trigger
- `migrations/0002_rls.sql` — Row Level Security
- `migrations/0003_storage.sql` — bucket `game-assets` + policy storage
- `migrations/0004_functions.sql` — fungsi RPC (simpan sesi, urut soal, akses share)
- `seed.sql` — data demo OPSIONAL

Jalankan berurutan di **SQL Editor** Supabase (lihat `docs/SUPABASE_SETUP.md`), atau dengan Supabase CLI
(`supabase db push`) bila Anda memakainya.
