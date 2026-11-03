import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, STORAGE_BUCKET } from "@/lib/constants";

/** URL publik objek di bucket game-assets (bucket publik, nama file acak). */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Format harus JPG, PNG, atau WebP.";
  if (file.size > MAX_IMAGE_BYTES) return `Ukuran gambar maksimal ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`;
  if (file.size === 0) return "File kosong.";
  return null;
}

/** Nama file TIDAK diambil dari nama asli pengguna: <userId>/<uuid>.<ext> */
export function buildObjectPath(userId: string, file: File): string {
  return `${userId}/${crypto.randomUUID()}.${EXT[file.type] ?? "bin"}`;
}

/** Unggah dengan progres (XHR ke REST Storage memakai token sesi pengguna). Hanya dipanggil dari browser. */
export function uploadWithProgress(opts: {
  url: string;
  anonKey: string;
  accessToken: string;
  path: string;
  file: File;
  onProgress: (percent: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${opts.url}/storage/v1/object/${STORAGE_BUCKET}/${opts.path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${opts.accessToken}`);
    xhr.setRequestHeader("apikey", opts.anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", opts.file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Unggah gagal")));
    xhr.onerror = () => reject(new Error("Koneksi terputus saat mengunggah"));
    xhr.send(opts.file);
  });
}
