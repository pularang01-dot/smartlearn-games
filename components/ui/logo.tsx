import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#3345C7" />
      <path d="M12 32l12 12 28-26" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="46" r="7" fill="#FFC93C" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="SmartLearn Games — beranda">
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight">SmartLearn Games</span>
    </Link>
  );
}
