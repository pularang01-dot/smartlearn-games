import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertTriangle, ChevronRight as Sep } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { buttonClasses } from "./button";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-white p-5", className)}>{children}</div>;
}

const badgeTones = {
  neutral: "bg-paper text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  success: "bg-correct-light text-correct-dark border-correct/20",
  warning: "bg-pencil-100 text-[#7A5600] border-pencil-300",
  danger: "bg-wrong-light text-wrong-dark border-wrong/20",
} as const;

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof badgeTones; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "published") return <Badge tone="success">Terbit</Badge>;
  if (status === "archived") return <Badge tone="neutral">Arsip</Badge>;
  return <Badge tone="warning">Draf</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-line/70", className)} />;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Terjadi kesalahan", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-wrong/30 bg-wrong-light/50 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-wrong" aria-hidden />
      <h3 className="text-lg font-semibold text-wrong-dark">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-wrong-dark/80">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Tooltip({ label, children, side = "top" }: { label: string; children: ReactNode; side?: "top" | "bottom" }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className={cn("pointer-events-none absolute left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100", side === "top" ? "bottom-full mb-2" : "top-full mt-2")}>
        {label}
      </span>
    </span>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-mute">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <Sep className="h-3.5 w-3.5" aria-hidden />}
            {it.href ? <Link href={it.href} className="rounded font-medium hover:text-brand-600 hover:underline">{it.label}</Link> : <span aria-current="page" className="font-semibold text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-ink-soft">{label}</p>
        <p className="font-display text-2xl font-semibold leading-tight">{value}</p>
        {hint && <p className="text-xs text-ink-mute">{hint}</p>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, total, pageSize, basePath, params }: { page: number; total: number; pageSize: number; basePath: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Halaman" className="mt-6 flex items-center justify-between gap-3">
      <p className="text-sm text-ink-soft">Halaman {page} dari {pages} · {total} data</p>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={buttonClasses("secondary", "sm")}><ChevronLeft className="h-4 w-4" aria-hidden />Sebelumnya</Link> : <span aria-disabled className={buttonClasses("secondary", "sm")}><ChevronLeft className="h-4 w-4" aria-hidden />Sebelumnya</span>}
        {page < pages ? <Link href={href(page + 1)} className={buttonClasses("secondary", "sm")}>Berikutnya<ChevronRight className="h-4 w-4" aria-hidden /></Link> : <span aria-disabled className={buttonClasses("secondary", "sm")}>Berikutnya<ChevronRight className="h-4 w-4" aria-hidden /></span>}
      </div>
    </nav>
  );
}
