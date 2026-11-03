import { createClient } from "@/lib/supabase/server";
import { one } from "@/features/games/mappers";

export async function listAllShares(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_shares")
    .select("id,game_id,permission,expires_at,revoked_at,created_at,game:games(title)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  type R = { id: string; game_id: string; permission: "read_only" | "duplicate"; expires_at: string | null; revoked_at: string | null; created_at: string; game: { title: string } | { title: string }[] | null };
  return ((data as unknown as R[]) ?? []).map((r) => ({ ...r, game_title: one(r.game)?.title ?? "(game dihapus)" }));
}
