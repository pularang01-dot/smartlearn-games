import Link from "next/link";
import { Gamepad2, Library, BarChart3, Share2, MonitorPlay, Timer } from "lucide-react";
import { HeroDemo } from "@/components/ui/hero-demo";
import { buttonClasses } from "@/components/ui/button";

const FEATURES = [
  { icon: Gamepad2, title: "Buat game untuk materi apa pun", text: "Tulis pernyataan, pilih Benar atau Salah, tambahkan penjelasan dan gambar. Autosave menjaga pekerjaan Anda." },
  { icon: MonitorPlay, title: "Dirancang untuk Smartboard", text: "Panel jawaban raksasa, tombol besar, mode layar penuh, dan kontrol guru yang bisa disembunyikan." },
  { icon: Timer, title: "Timer, skor, dan combo", text: "Atur batas waktu per soal, bonus kecepatan, dan combo. Skor dihitung ulang di server." },
  { icon: Library, title: "Bank soal pribadi", text: "Simpan soal terbaik, impor dari CSV, dan pakai ulang di game berikutnya." },
  { icon: BarChart3, title: "Riwayat dan laporan", text: "Lihat akurasi dan jawaban per soal untuk setiap sesi, lalu ekspor ke CSV." },
  { icon: Share2, title: "Bagikan dengan aman", text: "Tautan acak yang bisa dicabut kapan saja. Rekan guru dapat memainkan atau menyalin game Anda." },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Ubah pelajaran jadi game yang disentuh seluruh kelas</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            SmartLearn Games membantu guru membuat game Benar/Salah untuk Smartboard. Siswa menyentuh panel hijau atau merah, kelas langsung melihat jawabannya, dan Anda mendapat laporan hasilnya.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClasses("primary", "lg")}>Buat akun guru</Link>
            <Link href="/login" className={buttonClasses("secondary", "lg")}>Saya sudah punya akun</Link>
          </div>
          <p className="mt-4 text-sm text-ink-mute">Tanpa kamera atau perangkat khusus. Cukup browser di laptop, tablet, atau Smartboard.</p>
        </div>
        <HeroDemo />
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="max-w-2xl text-2xl font-semibold sm:text-3xl">Semua yang dibutuhkan guru untuk satu sesi kelas yang seru</h2>
          <div className="mt-8 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" aria-hidden /></div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl bg-brand-600 px-6 py-10 text-white sm:px-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Siap mencoba di kelas besok?</h2>
          <p className="mt-2 max-w-xl text-brand-100">Daftar, buat game contoh dengan satu klik, lalu jalankan di Smartboard Anda dalam beberapa menit.</p>
          <Link href="/register" className={buttonClasses("accent", "lg", "mt-6")}>Mulai sekarang</Link>
        </div>
      </section>
    </>
  );
}
