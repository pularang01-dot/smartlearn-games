import type { Metadata } from "next";

export const metadata: Metadata = { title: "Syarat Penggunaan" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 leading-relaxed text-ink-soft">
      <h1 className="text-3xl font-semibold text-ink">Syarat Penggunaan</h1>
      <p className="rounded-xl border border-pencil-300 bg-pencil-100 px-4 py-3 text-sm text-[#7A5600]">
        Ini adalah templat awal. Pengelola platform wajib menyesuaikan dan meninjau isinya sebelum dipakai untuk umum.
      </p>
      <h2 className="text-xl font-semibold text-ink">Penggunaan yang diizinkan</h2>
      <p>SmartLearn Games digunakan untuk keperluan pembelajaran. Anda bertanggung jawab atas konten yang Anda buat dan bagikan, serta wajib memiliki hak atas gambar dan materi yang diunggah.</p>
      <h2 className="text-xl font-semibold text-ink">Konten yang dilarang</h2>
      <p>Dilarang mengunggah konten yang melanggar hukum, hak cipta, bersifat kekerasan, pornografi, atau menyerang kelompok tertentu. Dilarang mencoba mengakses data guru lain atau mengganggu layanan.</p>
      <h2 className="text-xl font-semibold text-ink">Akun</h2>
      <p>Jaga kerahasiaan password Anda. Anda bertanggung jawab atas aktivitas pada akun Anda.</p>
      <h2 className="text-xl font-semibold text-ink">Hak kekayaan intelektual</h2>
      <p>Hak cipta atas aplikasi SmartLearn Games (kode, desain, ilustrasi, dan dokumentasi) dimiliki oleh Viky Aditama. Pengguna tidak diperkenankan menyalin, memodifikasi, atau mendistribusikan ulang aplikasi tanpa izin tertulis. Konten soal yang Anda buat tetap menjadi milik Anda.</p>
      <h2 className="text-xl font-semibold text-ink">Ketersediaan</h2>
      <p>Layanan disediakan apa adanya. Kami berusaha menjaga ketersediaan, namun tidak menjamin layanan bebas gangguan. Lakukan ekspor laporan secara berkala bila data penting bagi Anda.</p>
    </article>
  );
}