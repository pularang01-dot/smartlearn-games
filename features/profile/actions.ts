"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions/auth";
import { dbFail, fail, formFromZod, ok, type ActionResult, type FormState } from "@/lib/errors";
import { profileSchema } from "@/lib/validations/auth";
import type { ProfileRow } from "@/types/db";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi login berakhir. Silakan login kembali." };
  const parsed = profileSchema.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) return formFromZod(parsed.error);
  const supabase = await createClient();
  // Hanya display_name yang dikirim: role tidak pernah disentuh dari aplikasi.
  const { error } = await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", user.id);
  if (error) {
    const r = dbFail(error, "updateProfile");
    return { error: r.ok ? "Gagal menyimpan profil." : r.error };
  }
  revalidatePath("/dashboard", "layout");
  return { message: "Profil disimpan." };
}

type Prefs = NonNullable<ProfileRow["preferences"]>;

export async function updatePreferences(patch: { onboardingDone?: boolean; soundDefault?: boolean; reduceMotion?: boolean }): Promise<ActionResult<Prefs>> {
  const user = await getCurrentUser();
  if (!user) return fail("Sesi login berakhir. Silakan login kembali.", "auth");
  const clean: Prefs = {};
  if (typeof patch.onboardingDone === "boolean") clean.onboardingDone = patch.onboardingDone;
  if (typeof patch.soundDefault === "boolean") clean.soundDefault = patch.soundDefault;
  if (typeof patch.reduceMotion === "boolean") clean.reduceMotion = patch.reduceMotion;

  const supabase = await createClient();
  const { data: current } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  const merged = { ...((current?.preferences as Prefs | null) ?? {}), ...clean };
  const { error } = await supabase.from("profiles").update({ preferences: merged }).eq("id", user.id);
  if (error) return dbFail(error, "updatePreferences");
  revalidatePath("/dashboard", "layout");
  return ok(merged);
}
