import type { ZodError } from "zod";

export type ErrorCode = "validation" | "auth" | "conflict" | "not_found" | "unknown";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ErrorCode; fieldErrors?: Record<string, string[]> };

export function ok<T = void>(data?: T): ActionResult<T> {
  return { ok: true, data: data as T };
}

export function fail(error: string, code: ErrorCode = "unknown", fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, code, fieldErrors };
}

type DbError = { code?: string; message?: string } | null | undefined;

/** Ubah error database menjadi pesan ramah. Detail teknis hanya masuk log server. */
export function dbFail(error: DbError, context = "db"): ActionResult<never> {
  console.error(`[${context}]`, error?.code, error?.message);
  switch (error?.code) {
    case "23505":
      return fail("Data tersebut sudah ada.", "validation");
    case "42501":
      return fail("Anda tidak memiliki akses ke data ini.", "auth");
    case "23514":
    case "22P02":
    case "22001":
      return fail("Data yang dikirim tidak valid. Periksa isian Anda.", "validation");
    case "23503":
      return fail("Data terkait tidak ditemukan.", "not_found");
    case "28000":
      return fail("Sesi login berakhir. Silakan login kembali.", "auth");
    default:
      return fail("Terjadi kesalahan pada server. Coba lagi sebentar lagi.", "unknown");
  }
}

export function zodFail(error: ZodError): ActionResult<never> {
  const flat = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flat)) if (v) fieldErrors[k] = v;
  const first = Object.values(fieldErrors)[0]?.[0] ?? "Data tidak valid.";
  return fail(first, "validation", fieldErrors);
}

/** State untuk form yang memakai useActionState. */
export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  needsVerification?: boolean;
  email?: string;
};

export function formFromZod(error: ZodError): FormState {
  const r = zodFail(error);
  return r.ok ? {} : { error: r.error, fieldErrors: r.fieldErrors };
}
