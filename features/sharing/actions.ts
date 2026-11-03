"use server";

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions/auth";
import { getSiteUrl } from "@/lib/site";
import { dbFail, fail, ok, type ActionResult } from "@/lib/errors";
import { isUuid } from "@/lib/utils/misc";
import { revalidatePath } from "next/cache";

const AUTH_MSG = "Sesi login berakhir. Silakan login kembali.";
const DAY = 86_400_000;

export async function createShare(input: {
  gameId: string;
  permission: "read_only" | "duplicate";
  expiresInDays: number | null;
}): Promise<ActionResult<{ url: string; id: string; expiresAt: string | null }>> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  if (!isUuid(input.gameId) || !["read_only", "duplicate"].includes(input.permission)) return fail("Permintaan tidak valid.", "validation");
  if (input.expiresInDays !== null && ![7, 30, 90].includes(input.expiresInDays)) return fail("Masa berlaku tidak valid.", "validation");

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("id,status").eq("id", input.gameId).eq("owner_id", user.id).maybeSingle();
  if (!game) return fail("Game tidak ditemukan.", "not_found");
  if (game.status !== "published") return fail("Terbitkan game terlebih dahulu sebelum membagikannya.", "validation");

  const token = randomBytes(24).toString("base64url"); // 192 bit, tidak dapat ditebak
  const hash = createHash("sha256").update(token).digest("hex");
  const expiresAt = input.expiresInDays ? new Date(Date.now() + input.expiresInDays * DAY).toISOString() : null;

  const { data, error } = await supabase
    .from("game_shares")
    .insert({ owner_id: user.id, game_id: input.gameId, share_token_hash: hash, permission: input.permission, expires_at: expiresAt })
    .select("id")
    .single();
  if (error || !data) return dbFail(error, "createShare");

  const site = await getSiteUrl();
  return ok({ url: `${site}/share/${token}`, id: data.id as string, expiresAt });
}

export async function revokeShare(shareId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  if (!isUuid(shareId)) return fail("Tautan tidak ditemukan.", "not_found");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("owner_id", user.id)
    .is("revoked_at", null)
    .select("id");
  if (error) return dbFail(error, "revokeShare");
  if (!data?.length) return fail("Tautan tidak ditemukan atau sudah dicabut.", "not_found");
  revalidatePath("/dashboard/shared");
  return ok();
}

export async function duplicateSharedGame(token: string): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Silakan login untuk menyalin game ke workspace Anda.", "auth");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_shared_game", { p_token: token });
  if (error) {
    if (error.code === "P0002") return fail("Tautan ini tidak mengizinkan duplikasi atau sudah tidak berlaku.", "validation");
    return dbFail(error, "duplicateSharedGame");
  }
  revalidatePath("/dashboard", "layout");
  return ok({ id: data as string });
}
