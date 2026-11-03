import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-semibold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-ink-soft">Tautan mungkin salah, atau data tersebut bukan milik akun Anda.</p>
      <Link href="/dashboard" className={buttonClasses("primary", "lg", "mt-6")}>Kembali ke dashboard</Link>
    </div>
  );
}
