/**
 * Test integrasi isolasi data (RLS) terhadap Supabase NYATA.
 * Otomatis DILEWATI bila variabel TEST_* tidak diisi. Gunakan project Supabase khusus test
 * (migration 0001-0004 sudah dijalankan). Lihat docs/TESTING.md.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_SUPABASE_URL;
const anon = process.env.TEST_SUPABASE_ANON_KEY;
const service = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const enabled = Boolean(url && anon && service);

describe.skipIf(!enabled)("RLS: isolasi antar guru", () => {
  const stamp = Date.now();
  const emailA = `rls-a-${stamp}@example.test`;
  const emailB = `rls-b-${stamp}@example.test`;
  const password = "Passw0rd!test";
  let admin: SupabaseClient;
  let a: SupabaseClient;
  let b: SupabaseClient;
  let idA = "";
  let idB = "";
  let gameA = "";
  let questionA = "";

  const mk = () => createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });

  beforeAll(async () => {
    admin = createClient(url!, service!, { auth: { persistSession: false } });
    const ua = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
    const ub = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
    idA = ua.data.user!.id;
    idB = ub.data.user!.id;
    a = mk();
    b = mk();
    expect((await a.auth.signInWithPassword({ email: emailA, password })).error).toBeNull();
    expect((await b.auth.signInWithPassword({ email: emailB, password })).error).toBeNull();

    const g = await a.from("games").insert({ owner_id: idA, title: "Game milik A" }).select("id").single();
    expect(g.error).toBeNull();
    gameA = g.data!.id;
    const q = await a.from("questions").insert({ owner_id: idA, game_id: gameA, question_text: "Soal A", correct_answer: true }).select("id").single();
    expect(q.error).toBeNull();
    questionA = q.data!.id;
  });

  afterAll(async () => {
    if (!enabled) return;
    await admin.auth.admin.deleteUser(idA);
    await admin.auth.admin.deleteUser(idB);
  });

  it("Guru A dapat melihat game miliknya", async () => {
    const r = await a.from("games").select("id").eq("id", gameA);
    expect(r.data).toHaveLength(1);
  });

  it("Guru B tidak dapat melihat game Guru A (ganti ID di URL/request)", async () => {
    const r = await b.from("games").select("id").eq("id", gameA);
    expect(r.data ?? []).toHaveLength(0);
    const q = await b.from("questions").select("id").eq("id", questionA);
    expect(q.data ?? []).toHaveLength(0);
  });

  it("Guru B tidak dapat mengubah game Guru A", async () => {
    const r = await b.from("games").update({ title: "Dibajak" }).eq("id", gameA).select("id");
    expect(r.data ?? []).toHaveLength(0);
    const check = await a.from("games").select("title").eq("id", gameA).single();
    expect(check.data?.title).toBe("Game milik A");
  });

  it("Guru B tidak dapat menghapus game Guru A", async () => {
    await b.from("games").delete().eq("id", gameA);
    const check = await a.from("games").select("id").eq("id", gameA);
    expect(check.data).toHaveLength(1);
  });

  it("Guru B tidak dapat menyisipkan soal ke game Guru A", async () => {
    const r = await b.from("questions").insert({ owner_id: idB, game_id: gameA, question_text: "Suntikan", correct_answer: true });
    expect(r.error).not.toBeNull();
  });

  it("Guru B tidak dapat membuat game atas nama Guru A (owner_id dipalsukan)", async () => {
    const r = await b.from("games").insert({ owner_id: idA, title: "Palsu" });
    expect(r.error).not.toBeNull();
  });

  it("Guru B tidak dapat menyimpan sesi untuk game Guru A", async () => {
    const r = await b.rpc("save_game_session", {
      p_session: { id: crypto.randomUUID(), game_id: gameA, status: "completed", started_at: new Date().toISOString(), completed_at: new Date().toISOString(), total_questions: 1, total_score: 10, correct_count: 1, incorrect_count: 0, timeout_count: 0, accuracy: 100, duration_seconds: 5 },
      p_answers: [], p_achievements: [],
    });
    expect(r.error).not.toBeNull();
  });

  it("pengguna tidak dapat menaikkan role sendiri menjadi platform_admin", async () => {
    const r = await a.from("profiles").update({ role: "platform_admin" }).eq("id", idA);
    expect(r.error).not.toBeNull();
    const p = await a.from("profiles").select("role").eq("id", idA).single();
    expect(p.data?.role).toBe("teacher");
  });

  it("pengunjung anonim tidak dapat membaca tabel privat", async () => {
    const anonClient = mk();
    const r = await anonClient.from("games").select("id");
    expect(r.error !== null || (r.data ?? []).length === 0).toBe(true);
  });

  it("akses share hanya lewat token valid; token salah/dicabut ditolak", async () => {
    await a.from("games").update({ status: "published" }).eq("id", gameA);
    const { createHash, randomBytes } = await import("node:crypto");
    const token = randomBytes(24).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    const ins = await a.from("game_shares").insert({ owner_id: idA, game_id: gameA, share_token_hash: hash, permission: "read_only" }).select("id").single();
    expect(ins.error).toBeNull();

    const anonClient = mk();
    const ok = await anonClient.rpc("get_shared_game", { p_token: token });
    expect(ok.data?.game?.title).toBe("Game milik A");
    expect(JSON.stringify(ok.data)).not.toContain(idA); // owner_id tidak bocor

    const bad = await anonClient.rpc("get_shared_game", { p_token: randomBytes(24).toString("base64url") });
    expect(bad.data).toBeNull();

    await a.from("game_shares").update({ revoked_at: new Date().toISOString() }).eq("id", ins.data!.id);
    const revoked = await anonClient.rpc("get_shared_game", { p_token: token });
    expect(revoked.data).toBeNull();
  });

  it("Guru B tidak dapat membaca tabel share milik Guru A", async () => {
    const r = await b.from("game_shares").select("id");
    expect(r.data ?? []).toHaveLength(0);
  });
});
