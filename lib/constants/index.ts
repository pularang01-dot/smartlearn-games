export const APP_NAME = "SmartLearn Games";
export const STORAGE_BUCKET = "game-assets";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_IMPORT_ROWS = 500;
export const GAMES_PAGE_SIZE = 12;
export const SESSIONS_PAGE_SIZE = 20;
export const BANK_PAGE_SIZE = 20;
export const REPORT_MAX_ROWS = 2000;

export const GAME_STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  published: "Terbit",
  archived: "Arsip",
};

export const GRADE_SUGGESTIONS = [
  "PAUD/TK", "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6",
  "Kelas 7", "Kelas 8", "Kelas 9", "Kelas 10", "Kelas 11", "Kelas 12", "Umum",
];

export const BADGES: Record<string, { label: string; description: string }> = {
  first_session: { label: "Permainan pertama", description: "Menyelesaikan sesi permainan pertama." },
  perfect_score: { label: "Sempurna", description: "Semua jawaban benar." },
  monster_slayer: { label: "Pembasmi Monster", description: "Mengalahkan monster pada mode Lawan Monster." },
  combo_5: { label: "Combo 5", description: "5 jawaban benar berturut-turut." },
};