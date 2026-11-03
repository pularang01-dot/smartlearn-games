import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Lupa password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Lupa password</h1>
      <p className="mb-6 text-sm text-ink-soft">Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.</p>
      <ForgotForm />
    </>
  );
}
