# Keamanan

## Model ancaman singkat
| Ancaman | Mitigasi |
|---|---|
| Guru B membaca/mengubah data guru A (ganti ID di URL/request) | RLS per tabel + filter `owner_id` di query; halaman mengembalikan 404 yang sama untuk "tidak ada" dan "bukan milik Anda". Diuji di `tests/rls` |
| Memalsukan `owner_id` saat insert | Server mengisi `owner_id` dari sesi; policy `WITH CHECK owner_id = auth.uid()` |
| Menyisipkan soal/sesi ke game orang lain | Policy INSERT memeriksa `EXISTS (game milik auth.uid())` |
| Menaikkan role sendiri | Trigger `protect_profile_role` menolak perubahan role bila `auth.uid()` terisi; role hanya via SQL Editor/service role |
| Pengunjung anonim membaca data | `REVOKE ALL ... FROM anon`; satu-satunya jalur publik: `get_shared_game(token)` |
| Menebak tautan share | Token 192-bit acak; DB hanya menyimpan hash SHA-256; bisa kedaluwarsa dan dicabut; game harus berstatus *published* |
| Kebocoran data lewat share | Fungsi hanya mengembalikan field aman (tanpa owner_id, email, sesi) |
| Skor dimanipulasi dari browser | Skor dihitung ulang server; payload divalidasi zod; id soal harus milik game; jawaban ganda ditolak; waktu respons di-clamp |
| Sesi tersimpan ganda | ID sesi dari klien + `ON CONFLICT DO NOTHING` dalam satu transaksi |
| XSS | Tidak ada `dangerouslySetInnerHTML`; semua teks dirender React (di-escape) |
| CSV/formula injection | Ekspor memprefiks `'` pada sel yang diawali `= + - @` |
| Open redirect | `safeNext()` hanya mengizinkan path internal |
| Upload berbahaya | Bucket membatasi MIME (JPG/PNG/WebP) dan 2 MB; nama file acak buatan klien-sisi-aplikasi, bukan nama asli; policy folder `<user_id>/`; server menolak `image_path` di luar folder user |
| CSRF | Server Actions memeriksa Origin; satu-satunya route handler (`/api/reports/export`) bersifat GET baca-saja dan butuh sesi |
| Enumerasi akun | Pesan daftar & reset password netral; login memakai pesan umum |
| Service role bocor | Tidak dipakai aplikasi; tidak ada di env publik; `.env*` di-gitignore |
| Header | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (next.config.ts) |

## Batasan yang diketahui (jujur)
1. **Pemilik dapat memalsukan data sesinya sendiri** dengan memanggil RPC/tabel langsung memakai token loginnya (RLS memperbolehkan menulis baris miliknya). Ini tidak memengaruhi guru lain; perlindungan server-side ditujukan bagi alur aplikasi normal. Bila diperlukan integritas penuh, pindahkan penulisan ke role terpisah/`SECURITY DEFINER` yang melakukan perhitungan di SQL.
2. **Gambar bersifat publik-by-URL** (bucket publik, nama tak tertebak). Siapa pun yang memiliki URL gambar dapat melihatnya. Jangan unggah gambar sensitif.
3. **Kunci jawaban ikut dikirim ke browser** saat bermain (diperlukan untuk umpan balik instan). Siswa yang membuka DevTools di perangkat guru dapat melihatnya. Ini wajar untuk game kelas, bukan ujian.
4. **Rate limiting** aplikasi sendiri belum ada; mengandalkan batas bawaan Supabase Auth. Untuk produksi besar, tambahkan rate limit di edge (Vercel Firewall/Upstash).
5. **Tautan share tidak dapat ditampilkan ulang** (hanya hash disimpan). Cabut dan buat baru bila hilang.
6. Gambar tidak disalin saat game dibagikan/diduplikasi dari tautan (path milik folder pemilik asli).
7. Kebijakan Privasi/Syarat adalah templat; **wajib ditinjau** sebelum rilis publik.
8. Belum ada: audit log, 2FA aplikasi (Supabase mendukung MFA), antivirus untuk upload, penghapusan akun mandiri.

## Rotasi dan insiden
Bila anon key terekspos: itu publik by design. Bila service role key pernah terekspos: rotasi di Supabase (Settings > API) segera. Untuk mencabut semua tautan share sebuah game: tab Bagikan > Cabut, atau `update game_shares set revoked_at = now() where game_id = '...'`.
