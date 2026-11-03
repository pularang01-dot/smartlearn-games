import { createClient } from "@/lib/supabase/server";
import { BANK_PAGE_SIZE } from "@/lib/constants";
import { isUuid } from "@/lib/utils/misc";
import type { BankQuestionRow } from "@/types/db";

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function listBank(userId: string, params: { q?: string; subjectId?: string; page?: number }) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  let query = supabase.from("question_bank").select("*", { count: "exact" }).eq("owner_id", userId);
  if (params.subjectId && isUuid(params.subjectId)) query = query.eq("subject_id", params.subjectId);
  const q = params.q?.trim();
  if (q) query = query.ilike("question_text", `%${escapeLike(q.slice(0, 100))}%`);
  const from = (page - 1) * BANK_PAGE_SIZE;
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + BANK_PAGE_SIZE - 1);
  if (error) console.error("[listBank]", error.code, error.message);
  return { rows: (data as BankQuestionRow[] | null) ?? [], total: count ?? 0, page, pageSize: BANK_PAGE_SIZE };
}

/** Dipakai dialog "Ambil dari bank soal" di editor (maks. 200 terbaru, dengan pencarian). */
export async function searchBankForPicker(userId: string, q: string) {
  const supabase = await createClient();
  let query = supabase.from("question_bank").select("id,question_text,correct_answer,subject_id").eq("owner_id", userId);
  const term = q.trim();
  if (term) query = query.ilike("question_text", `%${escapeLike(term.slice(0, 100))}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(200);
  return (data as Pick<BankQuestionRow, "id" | "question_text" | "correct_answer" | "subject_id">[] | null) ?? [];
}
