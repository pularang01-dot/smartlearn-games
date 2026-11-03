import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Masuk ke akun guru</h1>
      <p className="mb-6 text-sm text-ink-soft">Lanjutkan ke ruang kerja game Anda.</p>
      <LoginForm next={sp.next} linkError={sp.error === "link"} />
    </>
  );
}
