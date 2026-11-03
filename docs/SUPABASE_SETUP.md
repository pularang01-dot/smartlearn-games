# Setup Supabase

## 1. Buat project
1. Daftar/login di <https://supabase.com>, klik **New project**, pilih region terdekat (mis. Singapore).
2. Simpan database password di tempat aman. Tunggu project siap.

## 2. Ambil kunci API
Buka **Project Settings > API**:
- **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Jangan memakai atau menyalin **service_role key** ke aplikasi. Aplikasi ini tidak membutuhkannya.

## 3. Jalankan migration (berurutan)
Buka **SQL Editor > New query**, tempel isi file satu per satu lalu **Run**:
1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_storage.sql`
4. `supabase/migrations/0004_functions.sql`

Setiap file harus selesai tanpa error sebelum lanjut. Bila Anda memakai Supabase CLI: `supabase link` lalu `supabase db push`.

## 4. Konfigurasi Auth
**Authentication > URL Configuration**
- **Site URL**: `http://localhost:3000` (lokal) atau URL produksi Anda
- **Redirect URLs**: tambahkan `http://localhost:3000/auth/callback` dan `https://DOMAIN-ANDA/auth/callback`

**Authentication > Providers > Email**: biarkan *Confirm email* aktif (disarankan di produksi). Untuk pengembangan lokal boleh dimatikan agar daftar langsung login.

Email bawaan Supabase dibatasi jumlah kirimnya; untuk produksi, pasang SMTP sendiri di **Authentication > SMTP Settings**.

## 5. Verifikasi storage
**Storage** harus berisi bucket `game-assets` (public, batas 2 MB, JPG/PNG/WebP). Dibuat oleh migration 0003.

## 6. Isi `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev` setelah mengubah env.

## 7. (Opsional) Data demo
Pilih salah satu:
- Di aplikasi: **Game saya > Buat game baru > Buat game contoh** (tidak otomatis; hanya atas klik Anda)
- SQL: ubah email di `supabase/seed.sql`, lalu jalankan di SQL Editor

## 8. Menjadikan seseorang platform_admin (opsional)
Role hanya bisa diubah lewat SQL Editor (pengguna aplikasi tidak bisa menaikkan role sendiri, diblokir trigger):
```sql
update public.profiles set role = 'platform_admin' where id = (select id from auth.users where email = 'admin@contoh.com');
```
Saat ini role admin hanya memberi hak baca profil; belum ada halaman admin (lihat docs/ACCEPTANCE.md).

## Troubleshooting
| Gejala | Penyebab umum |
|---|---|
| "Konfigurasi Supabase belum lengkap" | `.env.local` kosong/salah atau server belum di-restart |
| Daftar berhasil tapi tidak bisa login | Email belum diverifikasi; cek spam atau matikan *Confirm email* untuk dev |
| `permission denied`/`new row violates row-level security` | Migration 0002 belum dijalankan atau dijalankan sebagian |
| Upload gambar gagal | Migration 0003 belum dijalankan; file > 2 MB atau bukan JPG/PNG/WebP |
| Tautan reset password "tidak berlaku" | Dibuka di browser berbeda, atau Redirect URL belum didaftarkan |
| `function extensions.digest does not exist` | Extension pgcrypto belum aktif: **Database > Extensions > pgcrypto** |
