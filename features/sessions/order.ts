import { shuffle } from "@/lib/utils/misc";
import type { GameSettings } from "@/lib/validations/game";

type Orderable = { id: string; is_required: boolean };

/**
 * Susun urutan soal untuk satu permainan.
 * - questionLimit (Tantangan Acak): soal wajib selalu masuk; sisa kuota diisi soal opsional acak.
 * - shuffleQuestions: acak urutan akhir; jika tidak, pertahankan urutan editor.
 */
export function buildPlayOrder<T extends Orderable>(
  questions: readonly T[],
  settings: Pick<GameSettings, "shuffleQuestions" | "questionLimit">,
  rng: () => number = Math.random,
): T[] {
  let selected: T[] = [...questions];
  const limit = settings.questionLimit;
  if (limit !== null && limit < selected.length) {
    const required = selected.filter((q) => q.is_required);
    const optional = selected.filter((q) => !q.is_required);
    let pickedRequired: T[];
    let pickedOptional: T[] = [];
    if (required.length >= limit) {
      pickedRequired = shuffle(required, rng).slice(0, limit);
    } else {
      pickedRequired = required;
      pickedOptional = shuffle(optional, rng).slice(0, limit - required.length);
    }
    const chosen = new Set([...pickedRequired, ...pickedOptional].map((q) => q.id));
    selected = selected.filter((q) => chosen.has(q.id));
  }
  return settings.shuffleQuestions ? shuffle(selected, rng) : selected;
}
