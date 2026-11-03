# Pengujian

## Unit test (Vitest)
```bash
npm test
```
Mencakup: skor (benar/salah/timeout/bonus/combo/clamp waktu), `evaluateSession` (anti jawaban ganda, soal asing), mesin permainan (input terkunci, jeda, timeout, PREV/SKIP/END, hasil), urutan/acak/batas soal, parser CSV (kutip, `;`, BOM), normalisasi jawaban, pratinjau impor, validasi zod (soal, game, auth), `safeNext`, `isUuid`.

Logika murni (`scoring`, `engine`, `order`, `csv`) sudah dijalankan saat pembuatan (48 test lulus). `validation.test.ts` membutuhkan `zod`, sehingga baru dapat dijalankan setelah `npm install`.

## Test integrasi RLS
Membutuhkan project Supabase **khusus test** dengan 4 migration:
```bash
cp .env.test.example .env.test   # isi TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY
export $(grep -v '^#' .env.test | xargs) && npm test -- tests/rls
```
Test membuat dua guru sementara lalu memeriksa: guru B tidak bisa membaca/mengubah/menghapus data A, tidak bisa menyisipkan soal/sesi ke game A atau memalsukan `owner_id`, tidak bisa menaikkan role, anon tidak bisa membaca tabel, akses share hanya lewat token valid (token salah/dicabut ditolak, `owner_id` tidak bocor). Tanpa variabel `TEST_*` test ini dilewati. Service role key hanya dipakai test untuk membuat/menghapus user uji.

## E2E (Playwright)
```bash
npx playwright install chromium
npm run test:e2e
```
`public.spec.ts`: landing + demo panel, halaman publik, pengalihan route privat, share token palsu, validasi form. `teacher-flow.spec.ts` (butuh `E2E_EMAIL`/`E2E_PASSWORD`, akun guru di project test): login, buat game contoh, mainkan sampai selesai, hasil tersimpan.

## Checklist manual di Smartboard (wajib sebelum dipakai di kelas)
Perangkat: Smartboard/layar sentuh nyata, resolusi 1920x1080 dan idealnya satu perangkat lebih kecil.
- [ ] Panel Benar/Salah terlihat penuh tanpa scroll pada 1920x1080; teks soal panjang (500 karakter) masih terbaca/dapat di-scroll
- [ ] Sentuhan satu jari mengenai panel dengan tepat; sentuhan ganda cepat hanya menghitung satu jawaban
- [ ] Mode layar penuh (tombol F / ikon) masuk dan keluar dengan Esc
- [ ] Timer berjalan stabil 60 detik penuh; jeda menghentikan hitungan dan melanjutkan dari sisa
- [ ] Pindah tab 10 detik lalu kembali: perilaku timer sesuai harapan (berjalan menurut waktu nyata)
- [ ] Suara: benar, salah, timeout, selesai terdengar; tombol M mematikan; musik latar mati secara bawaan
- [ ] Toolbar guru dapat disembunyikan (H) dan dimunculkan dari tombol kecil kanan atas
- [ ] Orientasi potret: panel bertumpuk dan tetap mudah disentuh
- [ ] Hasil tersimpan; muncul di Riwayat sesi; matikan Wi-Fi saat selesai -> pesan error + "Coba simpan lagi" bekerja setelah Wi-Fi hidup, tanpa data ganda
- [ ] Kontras warna terbaca dari jarak 5 m; tombol/teks tidak bergantung warna saja (ikon + teks)
- [ ] Navigasi keyboard: Tab menjangkau semua kontrol, fokus terlihat, Enter/Spasi mengaktifkan
