import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "@/lib/constants";

/**
 * Hapus file gambar dari Storage hanya jika sudah tidak dirujuk oleh soal, bank soal, atau cover game mana pun.
 * Hanya path di folder milik user yang diproses. Kegagalan tidak boleh menggagalkan aksi utama.
 */
export async function cleanupUnusedImages(supabase: SupabaseClient, userId: string, paths: (string | null | undefined)[]) {
  try {
    const candidates = Array.from(new Set(paths.filter((p): p is string => !!p && p.startsWith(`${userId}/`))));
    if (candidates.length === 0) return;
    const [q, b, g] = await Promise.all([
      supabase.from("questions").select("image_path").in("image_path", candidates),
      supabase.from("question_bank").select("image_path").in("image_path", candidates),
      supabase.from("games").select("cover_image_path").in("cover_image_path", candidates),
    ]);
    const used = new Set<string>();
    (q.data ?? []).forEach((r: { image_path: string }) => used.add(r.image_path));
    (b.data ?? []).forEach((r: { image_path: string }) => used.add(r.image_path));
    (g.data ?? []).forEach((r: { cover_image_path: string }) => used.add(r.cover_image_path));
    const unused = candidates.filter((p) => !used.has(p));
    if (unused.length) await supabase.storage.from(STORAGE_BUCKET).remove(unused);
  } catch (e) {
    console.error("[cleanupUnusedImages]", e instanceof Error ? e.message : e);
  }
}
