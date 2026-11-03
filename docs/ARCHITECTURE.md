# Arsitektur

## Gambaran
```
Browser (React 19, client components untuk editor & pemutar)
   │  Server Actions (mutasi)        │  Server Components (baca data)
   ▼                                 ▼
Next.js server  ── @supabase/ssr (cookie sesi, getUser() memvalidasi JWT) ──►  Supabase
                                                                              ├ Auth
                                                                              ├ Postgres + RLS + RPC
                                                                              └ Storage (game-assets)
```
- **Identitas selalu dari sesi server** (`getCurrentUser()` memakai `auth.getUser()`), tidak pernah dari parameter klien. `owner_id` diisi server dan dipaksa lagi oleh RLS.
- **Dua lapis otorisasi**: query/aksi memfilter `owner_id` secara eksplisit, RLS menjadi jaring pengaman terakhir.
- Middleware me-refresh sesi dan mengalihkan route privat (`/dashboard`, `/play`) ke `/login?next=`. Halaman juga memanggil `requireUser()` (tidak bergantung pada middleware saja).

## Keputusan penting
| Topik | Keputusan | Alasan |
|---|---|---|
| Mutasi | Server Actions + zod | Validasi di server, perlindungan Origin bawaan Next, tanpa API route manual |
| Skor | Dihitung ulang di server (`evaluateSession`) | Klien tidak dipercaya; fungsi murni yang sama dipakai klien (tampilan) dan server (penyimpanan) |
| Simpan sesi | RPC `save_game_session` (1 transaksi) + id sesi dari klien | Atomik (sesi + jawaban + lencana) dan idempoten (tidak ganda saat klik/refresh berulang) |
| Concurrency editor | `updated_at` sebagai versi; update dengan `.eq("updated_at", versi)` | Deteksi edit dari tab/perangkat lain; pengguna boleh "Timpa dengan versi saya" |
| `updated_at` | Trigger `touch_updated_at(kolom_diabaikan)` | Ubah urutan soal / `last_played_at` tidak memicu konflik palsu |
| Soal baru | Draf lokal sampai valid, baru `INSERT` | Tidak ada baris sampah; validasi "pilih jawaban" bermakna |
| Gambar | Bucket publik, nama `<user_id>/<uuid>.<ext>`; upload langsung dari browser (XHR, progres) | Mudah tampil di halaman share; tulis/hapus dibatasi policy ke folder sendiri. File dihapus server bila tak dirujuk lagi |
| Share | Token acak 192-bit, hanya **hash SHA-256** disimpan; akses lewat fungsi `get_shared_game` (SECURITY DEFINER) | Anon tidak punya akses tabel; token bocor di DB tidak dapat dipakai |
| Mesin permainan | Reducer murni (`features/sessions/engine.ts`) + komponen tipis | Aturan permainan mudah diuji; input ganda terkunci oleh state |
| Timer | `performance.now()` + interval 200 ms; jeda mengakumulasi waktu | Tidak bergantung pada animasi/frame; tab latar tetap berjalan menurut waktu nyata |
| Mode lain | `game_mode`, `answer_type`, `options`, `audio_path` sudah ada di skema | Perluasan = migration yang melonggarkan CHECK + komponen baru; tidak perlu mengubah tabel |

## Aturan skor (didokumentasikan dan diuji)
- Benar = poin soal; salah/timeout = 0. Tidak ada skor negatif.
- Bonus waktu (opsional, butuh timer): hingga +50% poin dasar sebanding sisa waktu.
- Bonus combo (opsional): +10% poin dasar per jawaban benar beruntun ke-2 dst., maksimum +50%.
- Akurasi = benar / (benar + salah + timeout bila "timeout dianggap salah" aktif). Soal dilewati atau belum dijawab tidak dihitung.
- Status sesi: `completed` bila semua soal punya catatan, `ended_early` bila guru mengakhiri lebih awal.

## Alur simpan sesi
1. Pemutar mengumpulkan jawaban mentah (`questionId`, `given`, `timedOut`, `responseTimeMs`).
2. `saveSession` (server action): autentikasi, muat game+soal milik user, validasi payload (zod), hitung ulang skor, hitung lencana.
3. RPC `save_game_session` menyimpan semuanya dalam satu transaksi. `ON CONFLICT (id) DO NOTHING` menjamin idempotensi.
4. Klien menampilkan ringkasan dari server; bila gagal, jawaban tetap di layar dan tersedia tombol "Coba simpan lagi" (id sesi sama).

## Direktori
- `features/<domain>/actions.ts` ("use server") dan `queries.ts` (server-only)
- `features/sessions/{scoring,engine,order,badges}.ts` murni tanpa efek samping (target unit test)
- `components/game-player/*` pemutar; `components/game-editor/*` editor; `components/ui/*` primitif
