# Status fitur vs spesifikasi, batasan, dan roadmap

Legenda: ✅ dikerjakan | ⚠️ dikerjakan sebagian / perlu verifikasi di lingkungan nyata | ⏭️ belum dikerjakan (roadmap)

> Semua ✅ berarti **kode ditulis dan logika murninya diuji**, bukan berarti sudah dijalankan bersama Supabase nyata.
> Build, typecheck, lint, RLS test, dan E2E **belum dijalankan** (lingkungan pembuatan tidak punya internet).

## Fitur
| Area | Status | Catatan |
|---|---|---|
| Auth: daftar, login, logout, verifikasi email, kirim ulang verifikasi, lupa/reset password | ✅ | Reset memakai PKCE: buka tautan di browser yang sama |
| Profil, ganti password, preferensi | ✅ | Preferensi suara/animasi disimpan per perangkat (localStorage) |
| Landing page, privasi, syarat | ✅ | Privasi/Syarat = templat, wajib ditinjau |
| Dashboard + statistik + pencapaian | ✅ | |
| CRUD game, duplikat, arsip, publish, hapus | ✅ | |
| Cari/filter/urut/paginasi/grid-list | ✅ | |
| Editor: autosave, indikator, konflik versi, peringatan keluar | ✅ | |
| Pertanyaan: CRUD, urut (seret + tombol), duplikat, validasi inline | ✅ | Seret HTML5 tidak jalan di layar sentuh; tombol panah tersedia |
| Gambar soal/sampul + progres + hapus otomatis file tak terpakai | ✅ ⚠️ | Perlu uji upload dengan Storage nyata |
| Bank soal + impor CSV + template | ✅ | |
| Impor `.xlsx` langsung | ⏭️ | Simpan sebagai CSV (didokumentasikan) |
| Pemutar Smartboard (panel besar, timer, skor, combo, bonus, jeda, fullscreen, keyboard, suara, confetti, toolbar) | ✅ ⚠️ | Wajib uji di Smartboard nyata (docs/TESTING.md) |
| Mode: Benar/Salah | ✅ | |
| Mode Pilihan Ganda, Mencocokkan | ⏭️ | Skema siap (`game_mode`, `options`); butuh migration CHECK + komponen |
| Gaya permainan Lawan Monster | ✅ ⚠️ | Aturan diuji (13 test: HP, kritis, nyawa, menang/kalah/seri, mesin permainan, lencana); tampilan SVG/animasi belum dicoba di layar nyata. Tanpa migration (disimpan di `games.settings` JSON) |
| Mode kamera (berdiri kiri/kanan) | ✅ ⚠️ | Deteksi perbedaan-latar lokal, tanpa AI; logika diuji (12 test), **wajib uji di kamera/Smartboard nyata**. Hasil = suara mayoritas kelas, bukan per anak. Pose/gesture (MediaPipe) = roadmap |
| Tantangan Acak | ✅ (sebagai pengaturan) | Acak urutan + batas jumlah soal + soal wajib/opsional |
| Musik latar | ✅ | Nada sederhana WebAudio, default mati |
| Audio per soal (`audio_path`) | ⏭️ | Kolom tersedia, belum ada UI |
| Simpan sesi (server recompute, atomik, idempoten) | ✅ | |
| Riwayat sesi, detail, laporan, ekspor CSV | ✅ | Ekspor maks. 2.000 sesi |
| Berbagi (hash token, expiry, cabut, read-only/duplikat) | ✅ | Hasil main lewat share tidak disimpan; gambar tidak ikut tersalin |
| RLS, storage policy, fungsi RPC | ✅ ⚠️ | Perlu dijalankan & diuji dengan `tests/rls` |
| Role `platform_admin` | ⚠️ | Hanya fondasi (kolom + trigger + baca profil); belum ada halaman admin |
| Onboarding, panduan, tooltip, empty/error/loading state | ✅ | |
| Aksesibilitas | ⚠️ | Label, fokus, aria, kontras dirancang; belum diaudit dengan alat/pembaca layar |
| Rate limiting aplikasi | ⏭️ | Mengandalkan Supabase Auth |
| Notifikasi email, 2FA, penghapusan akun mandiri, audit log | ⏭️ | |

## Langkah yang harus Anda lakukan
1. `npm install`, lalu `npm run typecheck && npm run lint && npm run build`. Perbaiki bila ada galat tipe/lint kecil.
2. Jalankan migration, isi `.env.local`, uji manual alur utama.
3. Jalankan `tests/rls` pada project Supabase test dan Playwright.
4. Uji di Smartboard nyata memakai checklist.
5. Tinjau kebijakan privasi/syarat dengan pihak berwenang.

## Roadmap yang disarankan
Pilihan Ganda (zona kamera 4 arah) → Balapan Roket/Mode Tim → Mencocokkan → audio soal → halaman admin → impor `.xlsx` → rate limit edge → export PDF laporan → mode kompetisi tim.