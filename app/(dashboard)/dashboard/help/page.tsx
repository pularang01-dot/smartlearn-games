import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/misc";

export const metadata = { title: "Panduan" };

const GUIDES: { id: string; title: string; steps: string[] }[] = [
  { id: "akun", title: "Mendaftar dan login", steps: ["Buka halaman Daftar, isi nama, email, dan password (min. 8 karakter, huruf dan angka).", "Jika diminta, buka email Anda dan klik tautan verifikasi.", "Login dengan email dan password. Lupa password? Klik Lupa password di halaman masuk."] },
  { id: "buat-game", title: "Membuat game", steps: ["Buka Game saya lalu klik Buat game baru.", "Isi judul (wajib), mata pelajaran, kelas, dan topik.", "Anda dibawa ke editor. Semua perubahan tersimpan otomatis; lihat indikator Menyimpan… / Tersimpan di bawah judul."] },
  { id: "pertanyaan", title: "Menambah, mengubah, dan menghapus pertanyaan", steps: ["Di tab Pertanyaan, klik Tambah pertanyaan.", "Tulis pernyataan, pilih BENAR atau SALAH, dan isi penjelasan agar siswa belajar dari jawaban mereka.", "Atur poin dan batas waktu (opsional). Gunakan panah atau seret ikon di kiri untuk mengubah urutan.", "Gunakan tombol Duplikat atau Hapus pada setiap soal. Penghapusan meminta konfirmasi."] },
  { id: "csv", title: "Impor soal dari CSV/Excel", steps: ["Klik Impor CSV lalu Unduh template.", "Isi template di Excel/Google Sheets, lalu simpan sebagai CSV (Excel: Simpan Sebagai > CSV).", "Unggah file, periksa pratinjau dan daftar kesalahan per baris, lalu klik Impor.", "Kolom jawaban boleh berisi benar/salah, true/false, atau B/S. File .xlsx belum didukung langsung; simpan sebagai CSV terlebih dahulu."] },
  { id: "main", title: "Menjalankan game", steps: ["Klik Preview untuk mencoba tanpa menyimpan hasil.", "Klik Mainkan untuk sesi kelas. Isi label sesi (misalnya Kelas 5A - Senin) bila perlu, lalu tekan Mulai.", "Siswa menyentuh panel hijau (Benar) atau merah (Salah). Setelah umpan balik tampil, tekan Lanjut."] },
  { id: "smartboard", title: "Menggunakan Smartboard", steps: ["Buka aplikasi di browser Smartboard dan login.", "Klik Layar penuh pada layar awal atau tekan F.", "Toolbar guru di bagian atas berisi Jeda, Lewati, Akhiri, Reset, Suara, dan Layar penuh. Sembunyikan dengan H agar siswa tidak terganggu; tombol kecil di pojok kanan atas memunculkannya lagi."] },
  { id: "monster", title: "Gaya permainan Lawan Monster", steps: ["Di editor, tab Pengaturan permainan, pilih Gaya permainan: Lawan Monster, lalu atur Nyawa kelas.", "HP monster = setengah jumlah soal. Jawaban benar melukai monster; 3 benar beruntun = serangan kritis (2 HP). Jawaban salah atau waktu habis mengurangi satu nyawa kelas.", "Permainan selesai saat monster kalah (menang) atau nyawa habis (kalah). Bisa dipadukan dengan Mode kamera dan memakai soal Benar/Salah yang sudah ada."] },
  { id: "kamera", title: "Mode kamera (anak berdiri di sisi jawaban)", steps: ["Di editor, tab Pengaturan permainan, nyalakan Mode kamera (atau nyalakan dari layar awal saat bermain).", "Di layar awal, klik Nyalakan kamera dan izinkan akses di browser. Posisikan kamera diam menghadap area berdiri anak-anak.", "Klik Kalibrasi sekarang, minta semua anak keluar dari area kamera selama hitung mundur 3 detik, lalu Mulai.", "Saat soal tampil, anak-anak berdiri di sisi KIRI layar (BENAR) atau KANAN (SALAH). Setelah hitung mundur habis, sisi yang lebih banyak terisi menjadi jawaban. Guru dapat menekan Kunci jawaban (atau Enter) lebih cepat.", "Jika tidak ada yang berdiri atau jumlahnya seimbang, jawaban belum bisa dikunci; saat waktu habis dicatat sebagai timeout. Guru dapat memakai tombol panah ←/→ atau beralih ke sentuhan lewat toolbar.", "Tips: cahaya merata, kamera tidak digeser, latar tidak bergerak. Kalibrasi ulang bila cahaya ruangan berubah. Atur Sensitivitas bila deteksi terlalu mudah/sulit."] },
  { id: "suara", title: "Suara dan layar penuh", steps: ["Tombol speaker di toolbar (atau tombol M) menyalakan/mematikan suara. Musik latar mati secara bawaan.", "Tombol F atau ikon layar penuh masuk/keluar mode layar penuh. Tekan Esc untuk keluar."] },
  { id: "laporan", title: "Melihat laporan", steps: ["Riwayat sesi menampilkan setiap sesi dan detail jawaban per soal.", "Laporan menampilkan rata-rata skor dan akurasi, dengan filter tanggal dan game.", "Klik Ekspor CSV untuk mengunduh data sesuai filter."] },
];

const FAQ: [string, string][] = [
  ["Apakah perlu kamera?", "Tidak wajib. Secara bawaan jawaban dipilih dengan menyentuh dua panel di layar. Mode kamera bersifat opsional: anak berdiri di sisi kiri (Benar) atau kanan (Salah). Gambar kamera diproses di perangkat dan tidak direkam atau dikirim."],
  ["Apakah data siswa disimpan?", "Tidak ada data pribadi siswa yang diminta. Sesi hanya memiliki label opsional yang Anda ketik. Jangan memasukkan nama atau data sensitif siswa pada label."],
  ["Apa arti status Draf, Terbit, dan Arsip?", "Draf: sedang disusun. Terbit: siap dibagikan lewat tautan. Arsip: disembunyikan dari daftar utama tetapi tidak dihapus. Anda tetap bisa memainkan game berstatus draf sebagai pemilik."],
  ["Bagaimana skor dihitung?", "Jawaban benar mendapat poin soal tersebut; salah atau timeout mendapat 0 (tidak ada skor negatif). Bonus kecepatan dan combo bersifat opsional dan diatur per game. Skor dihitung ulang di server saat hasil disimpan."],
  ["Apa itu Timeout dianggap salah?", "Bila aktif, soal timeout ikut dihitung sebagai salah pada akurasi. Bila mati, soal timeout tidak memengaruhi akurasi."],
  ["Apakah hasil lewat tautan berbagi tersimpan?", "Tidak. Penerima tautan hanya memainkan atau menyalin game (bila Anda mengizinkan). Hasil sesi hanya tersimpan saat pemilik memainkan game dari akunnya."],
];

const TROUBLE: [string, string][] = [
  ["Tidak ada suara", "Pastikan suara tidak dimatikan (ikon speaker/tombol M) dan volume Smartboard menyala. Browser mungkin memblokir audio sampai ada sentuhan pertama; sentuh layar sekali lalu coba lagi."],
  ["Tulisan “Gagal menyimpan”", "Periksa koneksi internet. Isian Anda tetap ada di layar dan akan dicoba lagi; klik Coba lagi bila perlu. Jangan menutup tab sebelum indikator berubah menjadi Tersimpan."],
  ["Muncul pesan konflik penyimpanan", "Game dibuka di tab atau perangkat lain. Muat ulang untuk melihat versi terbaru, atau pilih Timpa dengan versi saya bila Anda yakin versi di layar ini yang benar."],
  ["Layar penuh tidak berfungsi", "Beberapa browser Smartboard membatasi layar penuh. Coba tombol F11 atau gunakan mode kiosk/penuh bawaan perangkat."],
  ["Email verifikasi/reset tidak masuk", "Periksa folder spam. Buka tautan reset di browser yang sama dengan tempat Anda memintanya."],
];

const SHORTCUTS: [string, string][] = [["← (panah kiri)", "Jawab BENAR"], ["→ (panah kanan)", "Jawab SALAH"], ["Enter / Spasi", "Mulai / Lanjut"], ["P", "Jeda / lanjutkan"], ["M", "Suara hidup/mati"], ["F", "Layar penuh"], ["H", "Sembunyikan/tampilkan toolbar guru"]];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Panduan penggunaan" description="Langkah-langkah singkat untuk guru. Tidak perlu pelatihan teknis." actions={<Link href="/dashboard/settings/preferences" className="text-sm font-semibold text-brand-600 hover:underline">Ulangi tur awal</Link>} />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Daftar isi" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {[...GUIDES.map((g) => [g.id, g.title]), ["pintasan", "Pintasan keyboard"], ["faq", "FAQ"], ["masalah", "Troubleshooting"]].map(([id, t]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-lg px-3 py-1.5 font-medium text-ink-soft hover:bg-white hover:text-brand-700">{t}</a></li>
            ))}
          </ul>
        </nav>
        <div className="space-y-5">
          {GUIDES.map((g) => (
            <Card key={g.id}>
              <h2 id={g.id} className="scroll-mt-24 text-lg font-semibold">{g.title}</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </Card>
          ))}
          <Card>
            <h2 id="pintasan" className="scroll-mt-24 text-lg font-semibold">Pintasan keyboard saat bermain</h2>
            <p className="mt-1 text-sm text-ink-soft">Pintasan tidak aktif saat Anda mengetik di kolom teks.</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">{SHORTCUTS.map(([k, v]) => (<div key={k} className="flex items-center gap-3 text-sm"><dt><kbd className="rounded-md border border-line bg-paper px-2 py-0.5 font-semibold">{k}</kbd></dt><dd className="text-ink-soft">{v}</dd></div>))}</dl>
          </Card>
          <Card>
            <h2 id="faq" className="scroll-mt-24 text-lg font-semibold">Pertanyaan yang sering diajukan</h2>
            <div className="mt-3 divide-y divide-line">{FAQ.map(([q, a]) => (<details key={q} className="group py-3"><summary className="cursor-pointer text-sm font-semibold">{q}</summary><p className="mt-2 text-sm leading-relaxed text-ink-soft">{a}</p></details>))}</div>
          </Card>
          <Card>
            <h2 id="masalah" className="scroll-mt-24 text-lg font-semibold">Troubleshooting</h2>
            <div className="mt-3 divide-y divide-line">{TROUBLE.map(([q, a]) => (<details key={q} className="py-3"><summary className="cursor-pointer text-sm font-semibold">{q}</summary><p className="mt-2 text-sm leading-relaxed text-ink-soft">{a}</p></details>))}</div>
          </Card>
        </div>
      </div>
    </>
  );
}