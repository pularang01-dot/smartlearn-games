"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { buildObjectPath, publicImageUrl, uploadWithProgress, validateImageFile } from "@/lib/storage";

export function ImageUpload({ value, userId, onChange, label = "Gambar (opsional)" }: { value: string | null; userId: string; onChange: (path: string | null) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = publicImageUrl(value);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const invalid = validateImageFile(file);
    if (invalid) return setError(invalid);
    try {
      setProgress(0);
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sesi login berakhir. Muat ulang halaman dan login kembali.");
      const path = buildObjectPath(userId, file);
      await uploadWithProgress({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        accessToken: data.session.access_token,
        path, file, onProgress: setProgress,
      });
      onChange(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unggah gagal. Coba lagi.");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt="Gambar terpilih" className="h-20 w-28 rounded-xl border border-line object-cover" /> : <div aria-hidden className="flex h-20 w-28 items-center justify-center rounded-xl border border-dashed border-line bg-paper text-ink-mute"><ImagePlus className="h-6 w-6" /></div>}
        <div className="space-y-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id={`img-${label}-${userId}`} onChange={(e) => void pick(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={progress !== null} onClick={() => input.current?.click()}>{url ? "Ganti gambar" : "Pilih gambar"}</Button>
            {url && <Button size="sm" variant="ghost" disabled={progress !== null} onClick={() => onChange(null)}><Trash2 className="h-4 w-4" aria-hidden />Hapus</Button>}
          </div>
          <p className="text-xs text-ink-mute">JPG, PNG, atau WebP. Maks. 2 MB.</p>
        </div>
      </div>
      {progress !== null && (
        <div className="mt-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progres unggah">
          <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mt-1 text-xs text-ink-mute">Mengunggah… {progress}%</p>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-wrong">{error}</p>}
    </div>
  );
}
