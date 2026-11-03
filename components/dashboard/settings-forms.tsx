"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Switch, TextField } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { applyMotionPreference, MOTION_KEY } from "@/components/ui/motion-preference";
import { updatePassword } from "@/features/auth/actions";
import { updatePreferences, updateProfile } from "@/features/profile/actions";
import type { FormState } from "@/lib/errors";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending}>{children}</Button>;
}

function Msg({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-wrong">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm font-medium text-correct">{state.message}</p>;
  return null;
}

export function ProfileForm({ displayName, email }: { displayName: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  const [pw, pwAction] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4 rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">Profil</h2>
        <TextField label="Nama tampilan" name="displayName" defaultValue={displayName} required maxLength={80} error={state.fieldErrors?.displayName?.[0]} />
        <TextField label="Email" value={email} readOnly disabled hint="Email tidak dapat diubah dari sini." />
        <Msg state={state} />
        <Submit>Simpan profil</Submit>
      </form>
      <form action={pwAction} className="space-y-4 rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">Ganti password</h2>
        <TextField label="Password baru" name="password" type="password" autoComplete="new-password" hint="Minimal 8 karakter, kombinasi huruf dan angka." error={pw.fieldErrors?.password?.[0]} />
        <TextField label="Ulangi password baru" name="confirmPassword" type="password" autoComplete="new-password" error={pw.fieldErrors?.confirmPassword?.[0]} />
        <Msg state={pw} />
        <Submit>Ganti password</Submit>
      </form>
    </div>
  );
}

export function PreferencesForm() {
  const toast = useToast();
  const [reduce, setReduce] = useState(false);
  const [sound, setSound] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setReduce(localStorage.getItem(MOTION_KEY) === "1");
      const s = localStorage.getItem("slg:sound");
      if (s !== null) setSound(s === "1");
    } catch { /* abaikan */ }
  }, []);

  const changeReduce = (v: boolean) => {
    setReduce(v);
    try { localStorage.setItem(MOTION_KEY, v ? "1" : "0"); } catch { /* abaikan */ }
    applyMotionPreference(v);
  };
  const changeSound = (v: boolean) => {
    setSound(v);
    try { localStorage.setItem("slg:sound", v ? "1" : "0"); } catch { /* abaikan */ }
  };
  const replayTour = async () => {
    setBusy(true);
    try { sessionStorage.removeItem("slg:tour-snoozed"); } catch { /* abaikan */ }
    const r = await updatePreferences({ onboardingDone: false });
    setBusy(false);
    toast(r.ok ? { title: "Tur panduan akan tampil lagi saat Anda membuka dashboard", tone: "success" } : { title: "Gagal", description: r.error, tone: "error" });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">Tampilan dan suara di perangkat ini</h2>
        <p className="mb-2 text-sm text-ink-soft">Pengaturan ini disimpan di browser perangkat yang Anda pakai (misalnya komputer Smartboard).</p>
        <Switch checked={reduce} onChange={changeReduce} label="Kurangi animasi" description="Mematikan confetti dan menyederhanakan transisi. Mengikuti pengaturan sistem bila sudah aktif di perangkat." />
        <Switch checked={sound} onChange={changeSound} label="Efek suara aktif" description="Berlaku saat game dimainkan. Guru tetap dapat mengubahnya dari toolbar permainan." />
      </div>
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">Tur panduan</h2>
        <p className="mb-3 text-sm text-ink-soft">Tampilkan kembali tur singkat penggunaan aplikasi.</p>
        <Button variant="secondary" onClick={replayTour} loading={busy}>Tampilkan tur lagi</Button>
      </div>
    </div>
  );
}
