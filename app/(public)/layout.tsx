import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/permissions/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2" aria-label="Navigasi utama">
            {user ? (
              <Link href="/dashboard" className={buttonClasses("primary", "md")}>Buka dashboard</Link>
            ) : (
              <>
                <Link href="/login" className={buttonClasses("ghost", "md")}>Masuk</Link>
                <Link href="/register" className={buttonClasses("primary", "md")}>Daftar gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft">
          <p>© {new Date().getFullYear()} SmartLearn Games</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-brand-600 hover:underline">Kebijakan Privasi</Link>
            <Link href="/terms" className="hover:text-brand-600 hover:underline">Syarat Penggunaan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
