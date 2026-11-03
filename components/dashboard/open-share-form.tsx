"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form";

/** Buka tautan berbagi yang diterima dari rekan guru (tempel URL atau kodenya). */
export function OpenShareForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const open = () => {
    const m = value.trim().match(/(?:\/share\/)?([A-Za-z0-9_-]{20,100})\/?$/);
    if (!m) return setError("Tempel tautan lengkap (…/share/kode) atau kode berbagi.");
    setError(undefined);
    router.push(`/share/${m[1]}`);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); open(); }} className="flex flex-wrap items-end gap-3">
      <TextField label="Tautan atau kode berbagi" value={value} onChange={(e) => setValue(e.target.value)} error={error} wrapperClassName="min-w-[260px] flex-1" placeholder="https://…/share/…" />
      <Button type="submit">Buka</Button>
    </form>
  );
}
