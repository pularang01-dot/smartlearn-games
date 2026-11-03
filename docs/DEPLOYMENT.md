# Deployment (Vercel)

1. Push project ke repository Git.
2. Di Vercel: **Add New > Project**, impor repository. Framework terdeteksi sebagai Next.js.
3. Isi **Environment Variables** (Production dan Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://domain-anda`
4. **Deploy**.
5. Di Supabase **Authentication > URL Configuration**: set **Site URL** ke domain produksi dan tambahkan `https://domain-anda/auth/callback` ke **Redirect URLs** (untuk Preview deployment, tambahkan pola domain preview bila diperlukan).
6. Pasang SMTP sendiri di Supabase untuk email verifikasi/reset yang andal.

## Checklist produksi
- [ ] 4 migration sudah dijalankan di project produksi (bukan hanya project dev)
- [ ] `service_role` key **tidak** ada di env Vercel maupun repository
- [ ] *Confirm email* aktif; SMTP kustom terpasang
- [ ] Halaman Privasi/Syarat sudah disesuaikan dan ditinjau
- [ ] Uji alur: daftar, verifikasi, buat game, mainkan, laporan, share + cabut, reset password
- [ ] Jalankan `npm run build` tanpa error; `npm run typecheck`; `npm run lint`
- [ ] Atur backup database (Supabase Pro memiliki PITR; plan gratis: ekspor berkala)
- [ ] Tinjau batas rate-limit Auth di dashboard Supabase

## Domain kustom
Tambahkan domain di Vercel, lalu perbarui `NEXT_PUBLIC_SITE_URL` dan Redirect URLs Supabase.

## Catatan Smartboard
Gunakan browser modern terbaru di Smartboard. Bila browser bawaan tua, pasang Chrome/Edge. Uji sentuhan multi-titik dan layar penuh pada perangkat nyata sebelum dipakai di kelas (lihat docs/TESTING.md).
