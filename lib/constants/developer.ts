/**
 * Data pengembang. Ubah di sini saja; halaman /developer, footer, dan metadata ikut berubah.
 * Kolom kontak yang dikosongkan ("") tidak akan ditampilkan.
 */
export type DeveloperInfo = { name: string; role: string; email: string; website: string; instagram: string; github: string; linkedin: string; whatsapp: string };

export const DEVELOPER: DeveloperInfo = {
  name: "Viky Aditama",
  role: "Pengembang SmartLearn Games",
  email: "",      // contoh: "viky@contoh.com"
  website: "",    // contoh: "https://vikyaditama.com"
  instagram: "",  // contoh: "https://instagram.com/username"
  github: "",     // contoh: "https://github.com/username"
  linkedin: "",   // contoh: "https://linkedin.com/in/username"
  whatsapp: "",   // contoh: "https://wa.me/628xxxxxxxxxx"
};

export const APP_START_YEAR = 2026;

/** "2026" atau "2026-2028" mengikuti tahun berjalan. */
export function copyrightYears(now = new Date()): string {
  const y = now.getFullYear();
  return y > APP_START_YEAR ? `${APP_START_YEAR}-${y}` : String(APP_START_YEAR);
}