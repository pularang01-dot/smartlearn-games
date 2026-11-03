import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Variabel NEXT_PUBLIC_* harus diakses secara literal agar ikut tertanam di bundle browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Konfigurasi Supabase belum lengkap (lihat .env.example).");
  return createBrowserClient(url, anonKey);
}
