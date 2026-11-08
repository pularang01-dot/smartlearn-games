import type { Metadata } from "next";
import Link from "next/link";
import { Github, Globe, Instagram, Linkedin, Mail, MessageCircle, type LucideIcon } from "lucide-react";
import { Copyright } from "@/components/ui/copyright";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { APP_NAME } from "@/lib/constants";
import { copyrightYears, DEVELOPER } from "@/lib/constants/developer";

export const metadata: Metadata = {
  title: "Developer",
  description: `${APP_NAME} dikembangkan oleh ${DEVELOPER.name}.`,
};

const STACK = ["Next.js (App Router) dan React", "TypeScript", "Tailwind CSS", "Supabase (Auth, PostgreSQL, Row Level Security, Storage)", "Vercel"];
const FEATURES = [
  "Game Benar/Salah untuk Smartboard dengan panel sentuh berukuran besar",
  "Mode kamera: anak-anak berdiri di sisi Benar atau Salah (diproses lokal, tanpa rekaman)",
  "Gaya permainan Lawan Monster: nyawa kelas melawan HP monster",
  "Bank soal, impor CSV, riwayat sesi, laporan, dan berbagi game lewat tautan aman",
];

export default function DeveloperPage() {
  const links: { label: string; href: string; icon: LucideIcon }[] = [
    DEVELOPER.email && { label: DEVELOPER.email, href: `mailto:${DEVELOPER.email}`, icon: Mail },
    DEVELOPER.website && { label: "Website", href: DEVELOPER.website, icon: Globe },
    DEVELOPER.whatsapp && { label: "WhatsApp", href: DEVELOPER.whatsapp, icon: MessageCircle },
    DEVELOPER.instagram && { label: "Instagram", href: DEVELOPER.instagram, icon: Instagram },
    DEVELOPER.github && { label: "GitHub", href: DEVELOPER.github, icon: Github },
    DEVELOPER.linkedin && { label: "LinkedIn", href: DEVELOPER.linkedin, icon: Linkedin },
  ].filter((x): x is { label: string; href: string; icon: LucideIcon } => Boolean(x));

  const initials = DEVELOPER.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="flex flex-col items-center gap-5 rounded-3xl bg-brand-600 px-6 py-10 text-center text-white sm:flex-row sm:text-left">
        <div aria-hidden className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-pencil-400 font-display text-4xl font-semibold text-ink shadow-lg">{initials}</div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Developer</p>
          <h1 className="text-3xl font-semibold sm:text-5xl">{DEVELOPER.name}</h1>
          <p className="mt-1 text-brand-100">{DEVELOPER.role}</p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Tentang {APP_NAME}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {APP_NAME} dibuat agar guru dapat mengubah materi pelajaran menjadi permainan yang seru dan mudah dimainkan bersama seluruh kelas di Smartboard.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">{FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Teknologi</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {STACK.map((t) => <li key={t} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">{t}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Hubungi developer</h2>
        {links.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Informasi kontak belum ditambahkan.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-3">
            {links.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className={buttonClasses("secondary", "md")}><Icon className="h-4 w-4" aria-hidden />{label}</a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6 bg-paper">
        <h2 className="text-lg font-semibold">Hak cipta</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          © {copyrightYears()} {DEVELOPER.name}. Seluruh hak cipta atas {APP_NAME}, termasuk kode sumber, desain antarmuka, ilustrasi, dan dokumentasinya, dilindungi.
          Dilarang menyalin, memodifikasi, mendistribusikan, atau menjual ulang tanpa izin tertulis dari pemegang hak cipta.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Konten soal dan materi yang dibuat guru tetap menjadi tanggung jawab dan milik masing-masing guru. Aplikasi ini memakai pustaka sumber terbuka (antara lain Next.js, React, Tailwind CSS, dan Supabase) yang tetap tunduk pada lisensinya masing-masing.
        </p>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
        <Copyright />
        <Link href="/" className={buttonClasses("ghost", "sm")}>Kembali ke beranda</Link>
      </div>
    </div>
  );
}