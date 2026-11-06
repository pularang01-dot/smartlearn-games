"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BattleStatus } from "@/features/sessions/battle";

export type MonsterMood = "idle" | "hit" | "laugh" | "dead";

const PALETTES: [string, string][] = [["#7C3AED", "#C4B5FD"], ["#EA580C", "#FDBA74"], ["#0891B2", "#67E8F9"], ["#16A34A", "#86EFAC"], ["#DB2777", "#F9A8D4"]];
const LABEL: Record<MonsterMood, string> = { idle: "Monster menunggu", hit: "Monster terkena serangan", laugh: "Monster tertawa", dead: "Monster dikalahkan" };

/** Monster ramah buatan sendiri (SVG), bukan karakter berhak cipta. */
export function MonsterSvg({ mood, variant, className }: { mood: MonsterMood; variant: number; className?: string }) {
  const [dark, light] = PALETTES[variant % PALETTES.length];
  return (
    <svg viewBox="0 0 120 120" className={cn("overflow-visible", className)} role="img" aria-label={LABEL[mood]}>
      <ellipse cx="60" cy="113" rx="34" ry="5" fill="#000" opacity=".12" />
      <path d="M30 36 L20 6 L50 26Z" fill={dark} />
      <path d="M90 36 L100 6 L70 26Z" fill={dark} />
      <path d="M60 24C92 24 108 48 106 76C104 100 86 109 60 109C34 109 16 100 14 76C12 48 28 24 60 24Z" fill={light} stroke={dark} strokeWidth="4" />
      <ellipse cx="60" cy="88" rx="25" ry="16" fill="#fff" opacity=".35" />
      {mood === "dead" ? (
        <g stroke="#1C2230" strokeWidth="4" strokeLinecap="round"><path d="M34 48l16 16M50 48L34 64M70 48l16 16M86 48L70 64" /></g>
      ) : mood === "hit" ? (
        <g stroke="#1C2230" strokeWidth="4.5" strokeLinecap="round" fill="none"><path d="M34 50l14 7-14 7M86 50L72 57l14 7" /></g>
      ) : (
        <g><circle cx="42" cy="56" r="12" fill="#fff" /><circle cx="78" cy="56" r="12" fill="#fff" /><circle cx={mood === "laugh" ? 44 : 42} cy="58" r="6" fill="#1C2230" /><circle cx={mood === "laugh" ? 80 : 78} cy="58" r="6" fill="#1C2230" /></g>
      )}
      {mood === "idle" && <path d="M44 80Q60 90 76 80" stroke="#1C2230" strokeWidth="4" strokeLinecap="round" fill="none" />}
      {mood === "laugh" && (<g><path d="M38 76Q60 104 82 76Z" fill="#1C2230" /><path d="M46 77h28" stroke="#fff" strokeWidth="5" /></g>)}
      {mood === "hit" && <path d="M46 86Q60 74 74 86" stroke="#1C2230" strokeWidth="4" strokeLinecap="round" fill="none" />}
      {mood === "dead" && <g><path d="M44 84Q60 78 76 84" stroke="#1C2230" strokeWidth="4" strokeLinecap="round" fill="none" /><path d="M64 84q4 14 10 10" stroke="#DB2777" strokeWidth="5" strokeLinecap="round" fill="none" /></g>}
    </svg>
  );
}

/** Panel status pertarungan: nyawa kelas (hati), HP monster, dan monsternya. */
export function BattleHud({ status, mood, hitKey, variant }: { status: BattleStatus; mood: MonsterMood; hitKey: string; variant: number }) {
  const pct = (status.hp / status.maxHp) * 100;
  const lostHeart = mood === "laugh" ? status.lives : -1;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white/85 px-3 py-1.5 shadow sm:gap-5 sm:px-5" aria-label="Status pertarungan melawan monster">
      <div className="flex items-center gap-1" role="img" aria-label={`Nyawa kelas ${status.lives} dari ${status.maxLives}`}>
        {Array.from({ length: status.maxLives }, (_, i) => (
          <Heart key={i} aria-hidden className={cn("h-6 w-6 sm:h-8 sm:w-8", i < status.lives ? "fill-wrong text-wrong" : "text-ink-mute/50", i === lostHeart && "animate-shake")} />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between text-xs font-bold sm:text-sm"><span>HP Monster</span><span className="tabular-nums">{status.hp}/{status.maxHp}</span></div>
        <div className="h-3.5 overflow-hidden rounded-full bg-line sm:h-4" role="progressbar" aria-valuemin={0} aria-valuemax={status.maxHp} aria-valuenow={status.hp} aria-label="HP monster">
          <div className={cn("h-full rounded-full transition-[width] duration-500", pct > 50 ? "bg-correct" : pct > 25 ? "bg-pencil-500" : "bg-wrong")} style={{ width: `${pct}%` }} />
        </div>
        {status.streak >= 2 && !status.over && <p className="mt-0.5 text-xs font-bold text-brand-700">{status.streak >= 3 ? "Serangan kritis aktif! (2 HP)" : "Satu benar lagi untuk serangan kritis!"}</p>}
      </div>
      <div className="relative">
        <div key={hitKey} className={cn(mood === "hit" && "animate-shake")}>
          <MonsterSvg mood={mood} variant={variant} className="h-16 w-16 sm:h-20 sm:w-20" />
        </div>
        {mood === "hit" && status.lastDamage > 0 && (
          <span key={`d-${hitKey}`} className="pointer-events-none absolute -top-1 right-0 animate-float-up whitespace-nowrap font-display text-xl font-bold text-wrong sm:text-2xl">-{status.lastDamage}{status.lastDamage > 1 ? " KRITIS!" : ""}</span>
        )}
      </div>
    </div>
  );
}