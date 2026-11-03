import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { SaveStatus } from "./use-autosave";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const base = "inline-flex items-center gap-1.5 text-sm font-medium";
  if (status === "saving" || status === "pending") return <span role="status" className={`${base} text-ink-soft`}><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Menyimpan…</span>;
  if (status === "saved") return <span role="status" className={`${base} text-correct`}><CheckCircle2 className="h-4 w-4" aria-hidden />Tersimpan</span>;
  if (status === "error" || status === "conflict") return <span role="alert" className={`${base} text-wrong`}><AlertTriangle className="h-4 w-4" aria-hidden />Gagal menyimpan</span>;
  return <span className={`${base} text-ink-mute`}>Perubahan tersimpan otomatis</span>;
}
