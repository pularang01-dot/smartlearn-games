import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/permissions/auth";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <h1 className="mb-1 text-2xl font-semibold">Tautan tidak berlaku</h1>
        <p className="mb-6 text-sm text-ink-soft">Tautan reset password sudah kedaluwarsa atau dibuka di browser yang berbeda dari tempat Anda memintanya. Minta tautan baru.</p>
        <Link href="/forgot-password" className="font-semibold text-brand-600 hover:underline">Minta tautan baru</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Buat password baru</h1>
      <p className="mb-6 text-sm text-ink-soft">Gunakan password yang belum pernah Anda pakai di tempat lain.</p>
      <ResetForm />
    </>
  );
}
