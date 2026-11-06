# Panduan Guru

Versi ringkas ada juga di aplikasi: menu **Panduan**.

## 1. Mulai
1. **Daftar** dengan nama, email, dan password (min. 8 karakter, huruf + angka). Verifikasi email bila diminta, lalu **Masuk**.
2. Ikuti tur singkat saat pertama kali masuk (bisa dilewati; ulangi dari Pengaturan > Preferensi).

## 2. Membuat game
- **Game saya > Buat game baru**, isi judul, mata pelajaran, kelas, topik.
- Ingin melihat contoh dulu? Klik **Buat game contoh** (game "Mengenal Tata Surya" berisi 5 soal).

## 3. Menambah pertanyaan
- Tab **Pertanyaan > Tambah pertanyaan**. Tulis pernyataan, pilih **BENAR** atau **SALAH**, isi penjelasan.
- Opsional: gambar, poin (1-1000), batas waktu per soal, tandai soal wajib.
- Perubahan tersimpan otomatis. Indikator di bawah judul: *Menyimpan…* / *Tersimpan* / *Gagal menyimpan*.
- Ubah urutan dengan panah atau seret ikon di kiri. **Duplikat**, **Simpan ke bank soal**, dan **Hapus** ada di tiap soal.
- Soal yang belum lengkap (misalnya belum memilih jawaban) belum tersimpan dan ditandai merah.

## 4. Impor dari CSV / Excel
**Impor CSV > Unduh template**, isi, simpan sebagai **CSV** (Excel: *Simpan Sebagai > CSV*), unggah. Anda akan melihat pratinjau dan daftar baris bermasalah (nomor baris + alasan). Baris valid saja yang diimpor. File `.xlsx` belum dibaca langsung.

Kolom: `question_text`, `correct_answer` (benar/salah, true/false, B/S) wajib; `explanation`, `points`, `time_limit_seconds`, `subject` opsional.

## 5. Pengaturan permainan
Tab **Pengaturan permainan**: timer per soal, timeout dianggap salah, bonus kecepatan, bonus combo, acak urutan, batasi jumlah soal (Tantangan Acak), izinkan kembali ke soal sebelumnya, tampilkan penjelasan, suara bawaan.

## 6. Menjalankan di Smartboard
1. **Preview** untuk mencoba tanpa menyimpan hasil. **Mainkan** untuk sesi sungguhan.
2. Isi **Label sesi** (mis. "Kelas 5A - Senin"). Jangan menulis nama siswa.
3. Tekan **Layar penuh**, lalu **Mulai**. Siswa menyentuh panel hijau/merah, lihat umpan balik, tekan **Lanjut**.
4. Toolbar guru: Jeda, Lewati, Akhiri, Reset, Suara, Layar penuh, Sembunyikan.

| Tombol | Fungsi |
|---|---|
| ← / → | Benar / Salah |
| Enter / Spasi | Mulai / Lanjut |
| P · M · F · H | Jeda · Suara · Layar penuh · Toolbar |

## 6a. Gaya permainan "Lawan Monster"
Tab **Pengaturan permainan > Gaya permainan > Lawan Monster**. Soal tidak perlu diubah: semua game Benar/Salah (termasuk 5 topik CSV) bisa dimainkan dengan gaya ini.
- Kelas melawan satu monster. **HP monster = setengah jumlah soal** (10 soal = 5 HP).
- **Jawaban benar** melukai monster 1 HP. **3 benar beruntun** atau lebih = **serangan kritis** (2 HP).
- **Jawaban salah atau waktu habis** mengurangi 1 **nyawa kelas** (bawaan 3, bisa 1-10).
- Menang bila HP monster habis (permainan langsung selesai); kalah bila nyawa habis. Bila soal habis sebelum keduanya terjadi, hasilnya seri.
- Cocok digabung dengan Mode kamera: seluruh kelas berdiri di sisi jawaban, lalu menyaksikan monster terkena serangan.
- Hasil tersimpan seperti biasa (skor, akurasi) ditambah hasil pertarungan, dan lencana **Pembasmi Monster** saat menang.

## 6b. Mode kamera (anak berdiri di sisi jawaban)
1. Nyalakan **Mode kamera** di Pengaturan permainan (atau di layar awal saat bermain).
2. Klik **Nyalakan kamera**, izinkan di browser, posisikan kamera diam menghadap area berdiri.
3. **Kalibrasi sekarang**: semua anak keluar dari area kamera selama hitung mundur 3 detik.
4. **Mulai**. Anak-anak berdiri di **kiri (BENAR)** atau **kanan (SALAH)**. Saat hitung mundur habis, sisi yang lebih banyak terisi menjadi jawaban; **Kunci jawaban**/Enter mengunci lebih cepat. Imbang atau kosong = belum terkunci/timeout.
5. Masalah? Tombol ←/→ untuk override guru, atau ikon kamera-coret di toolbar untuk beralih ke sentuhan.
Gambar kamera tidak direkam atau dikirim, dan kamera mati saat permainan selesai.

## 7. Hasil dan laporan
- **Riwayat sesi**: setiap sesi + detail jawaban per soal.
- **Laporan**: rata-rata skor/akurasi, filter tanggal (WIB) dan game, **Ekspor CSV**.

## 8. Berbagi
Terbitkan game, tab **Bagikan**: pilih izin (hanya main / boleh disalin) dan masa berlaku, salin tautan (hanya tampil sekali). **Cabut** kapan saja. Menerima tautan? Buka menu **Berbagi** dan tempel tautannya, atau langsung buka di browser.

## 9. Privasi
Aplikasi tidak meminta data pribadi siswa. Jangan menaruh nama atau data sensitif di label sesi, judul, atau soal.