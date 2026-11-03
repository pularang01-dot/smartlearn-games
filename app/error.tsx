"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const configIssue = /Supabase belum lengkap/i.test(error.message);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Ada yang tidak beres</h1>
      <p className="mt-2 max-w-md text-ink-soft">
        {configIssue ? error.message : "Terjadi kesalahan tak terduga. Coba muat ulang. Jika berulang, hubungi pengelola."}
      </p>
      {error.digest && <p className="mt-1 text-xs text-ink-mute">Kode: {error.digest}</p>}
      <Button className="mt-6" size="lg" onClick={reset}>Coba lagi</Button>
    </div>
  );
}
