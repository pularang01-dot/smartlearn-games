# Pengujian

## Unit test (Vitest)
```bash
npm test
```
Mencakup: aturan Lawan Monster (`battle.test.ts`, 13 test lulus), deteksi zona kamera (`zones.test.ts`, 12 test lulus), skor (benar/salah/timeout/bonus/combo/clamp waktu), `evaluateSession` (anti jawaban ganda, soal asing), mesin permainan (input terkunci, jeda, timeout, PREV/SKIP/END, hasil), urutan/acak/batas soal, parser CSV (kutip, `;`, BOM), normalisasi jawaban, pratinjau impor, validasi zod (soal, game, auth), `safeNext`, `isUuid`.

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

## Checklist Lawan Monster
- [ ] Gaya "Lawan Monster" aktif di pengaturan; layar awal menampilkan monster, HP, dan nyawa
- [ ] Benar -> monster bergetar dan HP turun (-1, serangan kritis -2 setelah 3 benar beruntun); salah/timeout -> satu hati hilang
- [ ] HP 0 -> layar hasil "Monster dikalahkan!" + confetti; nyawa 0 -> "monster menang" tanpa confetti
- [ ] Tombol berubah menjadi "Lihat hasil" saat pertarungan berakhir lebih awal; hasil tersimpan; detail sesi menampilkan lencana menang/kalah
- [ ] Gabungan dengan mode kamera: HUD monster tidak menutupi area berdiri anak-anak

## Checklist mode kamera (perangkat nyata)
- [ ] Izin kamera muncul hanya setelah menekan "Nyalakan kamera"; ditolak -> pesan jelas dan mode sentuhan tetap bisa dipakai
- [ ] Kalibrasi 3 detik dengan area kosong; setelah itu area kosong TIDAK mendeteksi apa pun (bar kosong)
- [ ] 1-3 orang berdiri kiri -> "Terdeteksi BENAR"; kanan -> SALAH; berimbang/kosong -> tidak terkunci
- [ ] Hitung mundur habis mengunci jawaban; kosong = timeout; "Kunci jawaban"/Enter mengunci lebih cepat
- [ ] Jeda menghentikan hitung mundur; ← / → tetap bisa dipakai guru sebagai override
- [ ] Beralih ke sentuhan dari toolbar saat kamera bermasalah; lampu kamera mati setelah hasil tampil
- [ ] Uji cahaya redup dan terang, ganti Sensitivitas; kalibrasi ulang setelah cahaya berubah

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