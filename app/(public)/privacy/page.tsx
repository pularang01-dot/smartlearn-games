import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 leading-relaxed text-ink-soft">
      <h1 className="text-3xl font-semibold text-ink">Kebijakan Privasi</h1>
      <p className="rounded-xl border border-pencil-300 bg-pencil-100 px-4 py-3 text-sm text-[#7A5600]">
        Ini adalah templat awal. Pengelola platform wajib menyesuaikan dan meninjau isinya (termasuk dengan penasihat hukum) sebelum dipakai untuk umum.
      </p>
      <h2 className="text-xl font-semibold text-ink">Data yang kami simpan</h2>
      <p>Untuk guru: nama tampilan, alamat email, dan password (disimpan terenkripsi oleh Supabase Auth, tidak pernah dapat kami baca). Konten buatan guru: game, pertanyaan, gambar, serta hasil sesi permainan.</p>
      <h2 className="text-xl font-semibold text-ink">Data siswa</h2>
      <p>Aplikasi tidak meminta nama, email, atau data pribadi siswa. Sesi permainan hanya memiliki label opsional yang diketik guru (misalnya &quot;Kelas 5A - Senin&quot;). Jangan memasukkan data pribadi atau sensitif siswa pada label.</p>
      <h2 className="text-xl font-semibold text-ink">Isolasi data</h2>
      <p>Setiap guru hanya dapat mengakses data miliknya, dijaga oleh Row Level Security pada database. Game hanya terlihat oleh orang lain bila Anda sendiri membuat tautan berbagi, dan tautan itu dapat dicabut kapan saja.</p>
      <h2 className="text-xl font-semibold text-ink">Penyimpanan lokal di perangkat</h2>
      <p>Aplikasi menyimpan preferensi tampilan non-sensitif (misalnya suara aktif/nonaktif dan kurangi animasi) di perangkat Anda. Cookie sesi dipakai untuk menjaga Anda tetap login.</p>
      <h2 className="text-xl font-semibold text-ink">Hak Anda</h2>
      <p>Anda dapat mengubah atau menghapus game, soal, dan sesi kapan saja dari dashboard. Untuk menghapus akun, hubungi pengelola platform.</p>
    </article>
  );
}
