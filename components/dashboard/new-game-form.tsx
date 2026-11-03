"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextField } from "@/components/ui/form";
import { createDemoGame, createGame } from "@/features/games/actions";
import { GRADE_SUGGESTIONS } from "@/lib/constants";
import type { FormState } from "@/lib/errors";
import type { SubjectRow } from "@/types/db";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" loading={pending}>{label}</Button>;
}

export function NewGameForm({ subjects }: { subjects: SubjectRow[] }) {
  const [state, action] = useActionState<FormState, FormData>(createGame, {});
  const [demoState, demoAction] = useActionState<FormState>(createDemoGame, {});
  const fe = state.fieldErrors ?? {};
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form action={action} className="space-y-5 rounded-2xl border border-line bg-white p-6" noValidate>
        {state.error && !state.fieldErrors && <p role="alert" className="rounded-xl bg-wrong-light px-4 py-3 text-sm font-medium text-wrong-dark">{state.error}</p>}
        <TextField label="Judul game" name="title" required maxLength={120} placeholder="Contoh: Mengenal Tata Surya" error={fe.title?.[0]} data-autofocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Mata pelajaran" name="subjectId" defaultValue="">
            <option value="">Belum dipilih</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectField>
          <TextField label="Kelas/jenjang" name="gradeLevel" list="grades" maxLength={40} placeholder="Kelas 6" />
          <datalist id="grades">{GRADE_SUGGESTIONS.map((g) => <option key={g} value={g} />)}</datalist>
        </div>
        <TextField label="Topik" name="topic" maxLength={120} placeholder="Contoh: Planet dan satelit" />
        <TextArea label="Deskripsi (opsional)" name="description" maxLength={1000} />
        <Submit label="Buat game dan tambah pertanyaan" />
      </form>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-pencil-100 text-[#7A5600]"><Sparkles className="h-5 w-5" aria-hidden /></div>
        <h2 className="text-lg font-semibold">Ingin melihat contoh dulu?</h2>
        <p className="mt-1.5 text-sm text-ink-soft">Kami akan menambahkan game “Mengenal Tata Surya” (5 soal) ke akun Anda. Anda bisa mengubah atau menghapusnya kapan saja.</p>
        <form action={demoAction} className="mt-4">
          {demoState.error && <p role="alert" className="mb-2 text-sm font-medium text-wrong">{demoState.error}</p>}
          <DemoButton />
        </form>
      </aside>
    </div>
  );
}

function DemoButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="accent" loading={pending} className="w-full">Buat game contoh</Button>;
}
