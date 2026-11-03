"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form";
import { requestPasswordReset, resendVerification, signIn, signUp, updatePassword } from "@/features/auth/actions";
import type { FormState } from "@/lib/errors";

const initial: FormState = {};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" loading={pending} className="w-full">{children}</Button>;
}

function Banner({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl border border-wrong/30 bg-wrong-light px-4 py-3 text-sm font-medium text-wrong-dark">{state.error}</p>;
  if (state.message) {
    return (
      <p role="status" className="flex gap-2 rounded-xl border border-correct/30 bg-correct-light px-4 py-3 text-sm font-medium text-correct-dark">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{state.message}
      </p>
    );
  }
  return null;
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useActionState(signIn, initial);
  const [resendState, resendAction] = useActionState(resendVerification, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <div className="space-y-4">
      {linkError && <p role="alert" className="rounded-xl border border-wrong/30 bg-wrong-light px-4 py-3 text-sm text-wrong-dark">Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan login atau minta tautan baru.</p>}
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <Banner state={state} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required error={fe.email?.[0]} />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required error={fe.password?.[0]} />
        <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">Lupa password?</Link></div>
        <Submit>Masuk</Submit>
      </form>
      {state.needsVerification && (
        <form action={resendAction} className="rounded-xl border border-line bg-paper p-4">
          <input type="hidden" name="email" value={state.email} />
          <Banner state={resendState} />
          <Button type="submit" variant="secondary" size="sm" className="mt-2">Kirim ulang tautan verifikasi</Button>
        </form>
      )}
      <p className="text-center text-sm text-ink-soft">Belum punya akun? <Link href="/register" className="font-semibold text-brand-600 hover:underline">Daftar gratis</Link></p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(signUp, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Banner state={state} />
        <TextField label="Nama lengkap" name="displayName" autoComplete="name" required error={fe.displayName?.[0]} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required error={fe.email?.[0]} />
        <TextField label="Password" name="password" type="password" autoComplete="new-password" required hint="Minimal 8 karakter, kombinasi huruf dan angka." error={fe.password?.[0]} />
        <TextField label="Ulangi password" name="confirmPassword" type="password" autoComplete="new-password" required error={fe.confirmPassword?.[0]} />
        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input type="checkbox" name="agree" className="mt-1 h-4 w-4 rounded border-line accent-brand-600" />
            <span>Saya menyetujui <Link href="/terms" className="font-semibold text-brand-600 hover:underline" target="_blank">Syarat Penggunaan</Link> dan <Link href="/privacy" className="font-semibold text-brand-600 hover:underline" target="_blank">Kebijakan Privasi</Link>.</span>
          </label>
          {fe.agree?.[0] && <p role="alert" className="mt-1 text-xs font-medium text-wrong">{fe.agree[0]}</p>}
        </div>
        <Submit>Buat akun</Submit>
      </form>
      <p className="text-center text-sm text-ink-soft">Sudah punya akun? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Masuk</Link></p>
    </div>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Banner state={state} />
        <TextField label="Email akun" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email?.[0]} />
        <Submit>Kirim tautan reset</Submit>
      </form>
      <p className="text-center text-sm"><Link href="/login" className="font-semibold text-brand-600 hover:underline">Kembali ke halaman masuk</Link></p>
    </div>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(updatePassword, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <Banner state={state} />
        <TextField label="Password baru" name="password" type="password" autoComplete="new-password" required hint="Minimal 8 karakter, kombinasi huruf dan angka." error={fe.password?.[0]} />
        <TextField label="Ulangi password baru" name="confirmPassword" type="password" autoComplete="new-password" required error={fe.confirmPassword?.[0]} />
        <Submit>Simpan password</Submit>
      </form>
      {state.message && <p className="text-center text-sm"><Link href="/dashboard" className="font-semibold text-brand-600 hover:underline">Lanjut ke dashboard</Link></p>}
    </div>
  );
}
