-- =====================================================================
-- SmartLearn Games — 0002: Row Level Security
-- Semua tabel privat memakai RLS dengan kebijakan eksplisit per operasi.
-- (select auth.uid()) dipakai agar nilai di-cache per query.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.games enable row level security;
alter table public.questions enable row level security;
alter table public.question_bank enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_answers enable row level security;
alter table public.game_shares enable row level security;
alter table public.achievements enable row level security;

-- profiles: baca/ubah profil sendiri. Insert dilakukan trigger (security definer), bukan klien.
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_platform_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- Perubahan kolom role diblokir oleh trigger protect_profile_role.

-- subjects: global (owner_id null) hanya baca; personal milik sendiri CRUD.
create policy subjects_select on public.subjects for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));
create policy subjects_insert on public.subjects for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy subjects_update on public.subjects for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy subjects_delete on public.subjects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- games
create policy games_select on public.games for select to authenticated
  using (owner_id = (select auth.uid()));
create policy games_insert on public.games for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (subject_id is null or exists (select 1 from public.subjects s where s.id = subject_id))
  );
create policy games_update on public.games for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (subject_id is null or exists (select 1 from public.subjects s where s.id = subject_id))
  );
create policy games_delete on public.games for delete to authenticated
  using (owner_id = (select auth.uid()));

-- questions: pemilik, dan game_id harus game milik pemilik yang sama.
create policy questions_select on public.questions for select to authenticated
  using (owner_id = (select auth.uid()));
create policy questions_insert on public.questions for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.owner_id = (select auth.uid()))
  );
create policy questions_update on public.questions for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.owner_id = (select auth.uid()))
  );
create policy questions_delete on public.questions for delete to authenticated
  using (owner_id = (select auth.uid()));

-- question_bank
create policy bank_select on public.question_bank for select to authenticated
  using (owner_id = (select auth.uid()));
create policy bank_insert on public.question_bank for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (subject_id is null or exists (select 1 from public.subjects s where s.id = subject_id))
  );
create policy bank_update on public.question_bank for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (subject_id is null or exists (select 1 from public.subjects s where s.id = subject_id))
  );
create policy bank_delete on public.question_bank for delete to authenticated
  using (owner_id = (select auth.uid()));

-- game_sessions
create policy sessions_select on public.game_sessions for select to authenticated
  using (owner_id = (select auth.uid()));
create policy sessions_insert on public.game_sessions for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.owner_id = (select auth.uid()))
  );
create policy sessions_delete on public.game_sessions for delete to authenticated
  using (owner_id = (select auth.uid()));
-- Sesi bersifat append-only: tidak ada policy UPDATE.

-- session_answers
create policy answers_select on public.session_answers for select to authenticated
  using (owner_id = (select auth.uid()));
create policy answers_insert on public.session_answers for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.game_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
  );
create policy answers_delete on public.session_answers for delete to authenticated
  using (owner_id = (select auth.uid()));

-- game_shares: hanya pemilik. Akses publik HANYA lewat fungsi get_shared_game (0004).
create policy shares_select on public.game_shares for select to authenticated
  using (owner_id = (select auth.uid()));
create policy shares_insert on public.game_shares for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.owner_id = (select auth.uid()))
  );
create policy shares_update on public.game_shares for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy shares_delete on public.game_shares for delete to authenticated
  using (owner_id = (select auth.uid()));

-- achievements
create policy achievements_select on public.achievements for select to authenticated
  using (owner_id = (select auth.uid()));
create policy achievements_insert on public.achievements for insert to authenticated
  with check (owner_id = (select auth.uid()));

-- Cabut hak anon pada semua tabel (pengunjung tidak boleh membaca apa pun secara langsung).
revoke all on all tables in schema public from anon;
