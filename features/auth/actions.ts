"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { formFromZod, type FormState } from "@/lib/errors";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validations/auth";
import { safeNext } from "@/lib/utils/misc";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return formFromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
      return { error: "Email Anda belum diverifikasi. Periksa kotak masuk atau kirim ulang tautan verifikasi.", needsVerification: true, email: parsed.data.email };
    }
    if (error.status === 429) return { error: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi." };
    return { error: "Email atau password salah." };
  }
  redirect(safeNext(String(formData.get("next") ?? ""), "/dashboard"));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    agree: formData.get("agree") ?? undefined,
  });
  if (!parsed.success) return formFromZod(parsed.error);

  const supabase = await createClient();
  const site = await getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName }, emailRedirectTo: `${site}/auth/callback?next=/dashboard` },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "Email sudah terdaftar. Silakan login." };
    if (error.code === "weak_password") return { error: "Password terlalu lemah. Gunakan kombinasi huruf dan angka yang lebih panjang." };
    if (error.status === 429) return { error: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi." };
    return { error: "Pendaftaran gagal. Coba lagi sebentar lagi." };
  }
  if (data.session) redirect("/dashboard");
  // Pesan sengaja netral agar tidak membocorkan apakah email sudah terdaftar.
  return { message: "Tautan verifikasi telah dikirim ke email Anda (jika belum terdaftar). Periksa kotak masuk dan folder spam, lalu login." };
}

export async function resendVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return formFromZod(parsed.error);
  const supabase = await createClient();
  const site = await getSiteUrl();
  await supabase.auth.resend({ type: "signup", email: parsed.data.email, options: { emailRedirectTo: `${site}/auth/callback?next=/dashboard` } });
  return { message: "Jika email terdaftar dan belum terverifikasi, tautan baru telah dikirim.", email: parsed.data.email };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return formFromZod(parsed.error);
  const supabase = await createClient();
  const site = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${site}/auth/callback?next=/reset-password` });
  if (error?.status === 429) return { error: "Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi." };
  return { message: "Jika email terdaftar, tautan reset password telah dikirim. Buka tautan itu di browser yang sama." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return formFromZod(parsed.error);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tautan reset sudah tidak berlaku. Minta tautan baru di halaman Lupa Password." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { error: "Password baru harus berbeda dari password lama." };
    if (error.code === "weak_password") return { error: "Password terlalu lemah." };
    return { error: "Gagal mengubah password. Coba lagi." };
  }
  return { message: "Password berhasil diubah." };
}
