"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; title: string; description?: string; tone: Tone };
type ToastFn = (t: { title: string; description?: string; tone?: Tone }) => void;

const ToastContext = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback<ToastFn>(
    ({ title, description, tone = "info" }) => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
    },
    [dismiss],
  );
  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className={cn("pointer-events-auto flex w-full max-w-md animate-slide-in items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg", t.tone === "error" ? "border-wrong/40" : t.tone === "success" ? "border-correct/40" : "border-line")}>
            {t.tone === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-correct" aria-hidden /> : t.tone === "error" ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-wrong" aria-hidden /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-soft">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi" className="rounded-lg p-1 text-ink-mute hover:bg-black/5"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
