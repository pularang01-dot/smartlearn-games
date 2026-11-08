import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, KeyRound } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Copyright } from "@/components/ui/copyright";
import { Button, buttonClasses } from "@/components/ui/button";
import { confirmEmailToken } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Konfirmasi", robots: { index: false, follow: false } };

const TYPES = ["signup", "recovery", "invite", "magiclink", "email_change", "email"];

/**
 * Halaman antara dari tautan email. Token baru dipakai saat tombol diklik (bukan saat halaman dibuka),
 * sehingga pemindai tautan otomatis pada email tidak menghanguskannya.
 */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; next?: string }> }) {
  const sp = await searchParams;
  const valid = Boolean(sp.token_hash) && TYPES.includes(sp.type ?? "");
  const recovery = sp.type === "recovery";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        {valid ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              {recovery ? <KeyRound className="h-8 w-8" aria-hidden /> : <MailCheck className="h-8 w-8" aria-hidden />}
            </div>
            <h1 className="text-2xl font-semibold">{recovery ? "Atur ulang kata sandi" : "Konfirmasi email Anda"}</h1>
            <p className="mt-2 text-sm text-ink-soft">
              {recovery ? "Tekan tombol di bawah untuk melanjutkan membuat kata sandi baru." : "Tekan tombol di bawah untuk mengaktifkan akun Anda."}
            </p>
            <form action={confirmEmailToken} className="mt-6">
              <input type="hidden" name="token_hash" value={sp.token_hash} />
              <input type="hidden" name="type" value={sp.type} />
              <input type="hidden" name="next" value={sp.next ?? ""} />
              <ConfirmButton recovery={recovery} />
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Tautan tidak valid</h1>
            <p className="mt-2 text-sm text-ink-soft">Tautan ini tidak lengkap atau sudah tidak berlaku. Silakan masuk, atau minta tautan baru.</p>
            <Link href="/login" className={buttonClasses("primary", "lg", "mt-6 w-full")}>Ke halaman masuk</Link>
          </>
        )}
      </div>
      <Copyright className="mt-6 max-w-md text-center text-xs text-ink-mute" />
    </div>
  );
}

function ConfirmButton({ recovery }: { recovery: boolean }) {
  return <Button type="submit" size="lg" className="w-full">{recovery ? "Lanjut buat kata sandi baru" : "Konfirmasi email"}</Button>;
}