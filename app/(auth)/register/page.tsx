import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Buat akun guru</h1>
      <p className="mb-6 text-sm text-ink-soft">Setiap guru memiliki ruang kerja pribadi. Game Anda tidak tercampur dengan guru lain.</p>
      <RegisterForm />
    </>
  );
}
