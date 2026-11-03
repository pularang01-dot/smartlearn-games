"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, ChevronsLeft, ChevronsRight, Gamepad2, HelpCircle, History, LayoutDashboard, LogOut, Menu, Settings, Share2, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/logo";
import { signOut } from "@/features/auth/actions";
import { OnboardingTour } from "@/components/onboarding/tour";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/games", label: "Game saya", icon: Gamepad2 },
  { href: "/dashboard/questions", label: "Bank soal", icon: BookOpen },
  { href: "/dashboard/sessions", label: "Riwayat sesi", icon: History },
  { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/shared", label: "Berbagi", icon: Share2 },
  { href: "/dashboard/help", label: "Panduan", icon: HelpCircle },
  { href: "/dashboard/settings/profile", label: "Pengaturan", icon: Settings },
];

const COLLAPSE_KEY = "slg:sidebar-collapsed";

export function DashboardShell({ displayName, email, showOnboarding, children }: { displayName: string; email: string; showOnboarding: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* abaikan */ }
  }, []);
  useEffect(() => { setDrawer(false); setMenu(false); }, [pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* abaikan */ }
      return !c;
    });
  };

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  const links = (compact: boolean) => (
    <nav aria-label="Menu dashboard" className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link key={href} href={href} title={compact ? label : undefined} aria-current={active ? "page" : undefined}
            className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors", active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-paper", compact && "justify-center px-0")}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {!compact && <span>{label}</span>}
            {compact && <span className="sr-only">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white transition-[width] lg:flex", collapsed ? "w-[76px]" : "w-64")}>
        <div className={cn("flex h-16 items-center border-b border-line", collapsed ? "justify-center" : "px-5")}>
          {collapsed ? <Link href="/dashboard" aria-label="Beranda dashboard"><LogoMark /></Link> : <Logo href="/dashboard" />}
        </div>
        {links(collapsed)}
        <button type="button" onClick={toggle} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"} className="m-3 flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-ink-mute hover:bg-paper">
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <><ChevronsLeft className="h-5 w-5" />Ciutkan</>}
        </button>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo href="/dashboard" />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup menu" className="rounded-lg p-1.5 hover:bg-paper"><X className="h-5 w-5" /></button>
            </div>
            {links(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Buka menu" className="rounded-lg p-2 hover:bg-paper lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="hidden lg:block" />
          <div className="relative">
            <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-paper">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pencil-400 text-sm font-bold">{(displayName || email).slice(0, 1).toUpperCase()}</span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[160px] truncate text-sm font-semibold leading-tight">{displayName || "Guru"}</span>
                <span className="block max-w-[160px] truncate text-xs text-ink-mute">{email}</span>
              </span>
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-xl">
                <Link role="menuitem" href="/dashboard/settings/profile" className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-paper"><Settings className="h-4 w-4" aria-hidden />Profil saya</Link>
                <form action={signOut}>
                  <button role="menuitem" type="submit" className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-wrong hover:bg-wrong-light"><LogOut className="h-4 w-4" aria-hidden />Keluar</button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
      {showOnboarding && <OnboardingTour />}
    </div>
  );
}
