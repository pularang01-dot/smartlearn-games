import { normalizeAnswer } from "@/lib/answer";

export type ParsedImportRow = {
  line: number; // nomor baris pada file (header = 1)
  questionText: string;
  correctAnswer: boolean | null;
  explanation: string | null;
  points: number;
  timeLimitSeconds: number | null;
  subject: string | null;
  errors: string[];
};

export type ImportPreview = {
  rows: ParsedImportRow[];
  fileErrors: string[];
};

const REQUIRED = ["question_text", "correct_answer"];

/** Validasi baris hasil parseCsv. Dipakai untuk preview di browser; server memvalidasi ulang. */
export function buildImportPreview(table: string[][]): ImportPreview {
  const fileErrors: string[] = [];
  if (table.length === 0) return { rows: [], fileErrors: ["File kosong."] };

  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  for (const col of REQUIRED) if (idx(col) === -1) fileErrors.push(`Kolom "${col}" tidak ditemukan pada baris pertama.`);
  if (fileErrors.length) return { rows: [], fileErrors };

  const iText = idx("question_text");
  const iAns = idx("correct_answer");
  const iExp = idx("explanation");
  const iPts = idx("points");
  const iTime = idx("time_limit_seconds");
  const iSub = idx("subject");

  const rows: ParsedImportRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const errors: string[] = [];

    const questionText = get(iText);
    if (!questionText) errors.push("Pertanyaan kosong");
    else if (questionText.length > 500) errors.push("Pertanyaan lebih dari 500 karakter");

    const correctAnswer = normalizeAnswer(get(iAns));
    if (correctAnswer === null) errors.push('Jawaban tidak dikenali (gunakan benar/salah, true/false, atau B/S)');

    const explanation = get(iExp) || null;
    if (explanation && explanation.length > 1000) errors.push("Penjelasan lebih dari 1000 karakter");

    let points = 10;
    const rawPts = get(iPts);
    if (rawPts) {
      const n = Number(rawPts);
      if (!Number.isInteger(n) || n < 1 || n > 1000) errors.push("Poin harus bilangan bulat 1-1000");
      else points = n;
    }

    let timeLimitSeconds: number | null = null;
    const rawTime = get(iTime);
    if (rawTime) {
      const n = Number(rawTime);
      if (!Number.isInteger(n) || n < 5 || n > 300) errors.push("Batas waktu harus bilangan bulat 5-300 detik");
      else timeLimitSeconds = n;
    }

    rows.push({
      line: r + 1,
      questionText,
      correctAnswer,
      explanation,
      points,
      timeLimitSeconds,
      subject: get(iSub) || null,
      errors,
    });
  }
  if (rows.length === 0) fileErrors.push("Tidak ada baris data di bawah header.");
  return { rows, fileErrors };
}
