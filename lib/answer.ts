const TRUE_WORDS = new Set(["true", "benar", "b", "ya", "yes", "y", "1", "t"]);
const FALSE_WORDS = new Set(["false", "salah", "s", "tidak", "no", "n", "0", "f"]);

/** Normalisasi jawaban dari CSV: true/false, benar/salah, B/S. Mengembalikan null bila tidak dikenali. */
export function normalizeAnswer(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (TRUE_WORDS.has(v)) return true;
  if (FALSE_WORDS.has(v)) return false;
  return null;
}
