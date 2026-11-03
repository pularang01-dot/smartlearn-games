# SmartLearn Games

Platform web untuk guru membuat dan memainkan **game pembelajaran Benar/Salah** di **Smartboard / layar sentuh**.
Dibangun dengan Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Auth, Postgres + RLS, Storage).

> **Status jujur:** kode lengkap sudah ditulis dan logika inti (skor, mesin permainan, urutan soal, CSV) lolos 48 unit test
> yang dijalankan di lingkungan pembuatan. Project ini **belum pernah di-build/dijalankan bersama Supabase sungguhan**
> (lingkungan pembuatan tanpa akses internet, sehingga `npm install`, `next build`, `tsc`, ESLint, dan Playwright
> belum dijalankan). Ikuti langkah verifikasi di bawah; kemungkinan ada beberapa perbaikan tipe/lint kecil. Lihat
> [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) untuk status per fitur.

## Fitur

- Auth guru (daftar, login, logout, verifikasi email, lupa/reset password), profil, preferensi, tur onboarding
- Game: buat, edit (autosave + deteksi konflik), duplikat, arsip, hapus, terbitkan; cari/filter/urutkan/paginasi
- Pertanyaan Benar/Salah: penjelasan, gambar (upload dengan progres), poin, batas waktu, soal wajib/opsional, urut ulang (seret / tombol)
- Bank soal pribadi + impor CSV (pratinjau & laporan error per baris) + ekspor laporan CSV
- Pemutar Smartboard: panel besar, timer akurat, skor/combo/bonus waktu, jeda, layar penuh, shortcut keyboard, suara (WebAudio), confetti, toolbar guru yang bisa disembunyikan
- Skor **dihitung ulang di server**; penyimpanan sesi idempoten & atomik (satu RPC)
- Riwayat sesi, detail jawaban per soal, laporan + filter tanggal/game
- Berbagi game via tautan acak (hash di DB), kedaluwarsa, pencabutan, izin read-only/duplikat
- Isolasi data antar guru dengan Row Level Security (diverifikasi oleh test integrasi `tests/rls`)

## Mulai cepat

Prasyarat: Node.js >= 20.9, akun Supabase.

```bash
npm install
cp .env.example .env.local      # isi URL dan anon key Supabase
# jalankan 4 file SQL di supabase/migrations/ berurutan (lihat docs/SUPABASE_SETUP.md)
npm run dev                      # http://localhost:3000
```

## Verifikasi setelah `npm install`

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm test            # unit test (+ test RLS jika TEST_* diisi)
npm run build
npm run test:e2e    # Playwright (npx playwright install chromium dulu)
```

## Struktur

```
app/                  route (public, auth, dashboard, play, share, api)
components/           ui, dashboard, game-editor, game-player, onboarding, reports
features/             server actions + queries per domain (games, questions, sessions, sharing, ...)
lib/                  supabase client, validasi zod, csv, sound, storage, util
supabase/migrations   skema, RLS, storage, fungsi RPC
tests/                unit, rls (integrasi), e2e
docs/                 arsitektur, setup, deploy, testing, keamanan, panduan guru
```

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Setup Supabase langkah demi langkah |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy ke Vercel + env + checklist |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Keputusan arsitektur, alur data, aturan skor |
| [docs/SECURITY.md](docs/SECURITY.md) | Model ancaman, RLS, batasan yang diketahui |
| [docs/TESTING.md](docs/TESTING.md) | Cara menjalankan test, checklist manual Smartboard |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Panduan guru |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Status fitur vs spesifikasi, batasan & roadmap |
