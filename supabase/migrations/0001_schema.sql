-- =====================================================================
-- SmartLearn Games — 0001: skema tabel, constraint, indeks, trigger
-- Jalankan berurutan: 0001 -> 0002 -> 0003 -> 0004
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Trigger generik updated_at.
-- Argumen trigger = daftar kolom yang diabaikan (perubahan hanya pada kolom itu
-- tidak menaikkan updated_at). Update tanpa perubahan juga tidak menaikkan updated_at.
-- updated_at dipakai aplikasi sebagai versi (optimistic concurrency).
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
declare
  ignored text[] := coalesce(tg_argv, '{}'::text[]);
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'updated_at' - ignored) = (to_jsonb(old) - 'updated_at' - ignored) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text,
  role text not null default 'teacher' check (role in ('teacher', 'platform_admin')),
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Role tidak boleh diubah oleh pengguna yang sedang login (auth.uid() terisi).
-- Perubahan role hanya bisa lewat SQL Editor / service role (auth.uid() null).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'id profil tidak boleh diubah' using errcode = '42501';
  end if;
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Perubahan role tidak diizinkan' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Buat profil otomatis saat user baru mendaftar. Role selalu 'teacher'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), ''), 80),
    'teacher'
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'platform_admin');
$$;

-- ---------------------------------------------------------------------
-- subjects (owner_id null = kategori global read-only)
-- ---------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
create unique index subjects_owner_name_idx
  on public.subjects (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

insert into public.subjects (owner_id, name) values
  (null, 'IPA'), (null, 'IPS'), (null, 'Matematika'), (null, 'Bahasa Indonesia'),
  (null, 'Bahasa Inggris'), (null, 'PPKn'), (null, 'Pendidikan Agama'), (null, 'Seni Budaya'),
  (null, 'PJOK'), (null, 'Informatika'), (null, 'Umum');

-- ---------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (char_length(description) <= 1000),
  subject_id uuid references public.subjects (id) on delete set null,
  grade_level text check (char_length(grade_level) <= 40),
  topic text check (char_length(topic) <= 120),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  cover_image_path text check (char_length(cover_image_path) <= 300),
  -- Mode lain (multiple_choice, matching, ...) ditambahkan lewat migration baru yang memperluas constraint ini.
  game_mode text not null default 'true_false' check (game_mode in ('true_false')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  last_played_at timestamptz
);
create index games_owner_updated_idx on public.games (owner_id, updated_at desc);
create index games_owner_status_idx on public.games (owner_id, status);
create index games_owner_played_idx on public.games (owner_id, last_played_at desc nulls last);
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at('last_played_at');

-- ---------------------------------------------------------------------
-- questions
-- ---------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  question_text text not null check (char_length(trim(question_text)) between 1 and 500),
  answer_type text not null default 'true_false' check (answer_type in ('true_false')),
  correct_answer jsonb not null check (jsonb_typeof(correct_answer) = 'boolean'),
  options jsonb check (options is null or jsonb_typeof(options) = 'array'),
  explanation text check (char_length(explanation) <= 1000),
  image_path text check (char_length(image_path) <= 300),
  audio_path text check (char_length(audio_path) <= 300), -- disiapkan; belum ada UI audio
  points integer not null default 10 check (points between 1 and 1000),
  time_limit_seconds integer check (time_limit_seconds between 5 and 300),
  is_required boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_game_position_idx on public.questions (game_id, position, created_at);
create index questions_owner_idx on public.questions (owner_id);
-- Perubahan urutan saja tidak menaikkan updated_at (agar tidak memicu konflik autosave).
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at('position');

-- ---------------------------------------------------------------------
-- question_bank
-- ---------------------------------------------------------------------
create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_text text not null check (char_length(trim(question_text)) between 1 and 500),
  game_mode text not null default 'true_false' check (game_mode in ('true_false')),
  correct_answer jsonb not null check (jsonb_typeof(correct_answer) = 'boolean'),
  options jsonb check (options is null or jsonb_typeof(options) = 'array'),
  explanation text check (char_length(explanation) <= 1000),
  subject_id uuid references public.subjects (id) on delete set null,
  image_path text check (char_length(image_path) <= 300),
  audio_path text check (char_length(audio_path) <= 300),
  points integer not null default 10 check (points between 1 and 1000),
  time_limit_seconds integer check (time_limit_seconds between 5 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index question_bank_owner_idx on public.question_bank (owner_id, subject_id, created_at desc);
create trigger question_bank_touch before update on public.question_bank
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- game_sessions & session_answers
-- ---------------------------------------------------------------------
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(), -- dibuat klien (UUID) => penyimpanan idempoten
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  session_label text check (char_length(session_label) <= 80),
  status text not null default 'completed' check (status in ('completed', 'ended_early')),
  started_at timestamptz not null,
  completed_at timestamptz,
  total_questions integer not null default 0 check (total_questions >= 0),
  total_score integer not null default 0 check (total_score >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  timeout_count integer not null default 0 check (timeout_count >= 0),
  accuracy numeric(5, 2) not null default 0 check (accuracy between 0 and 100),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  game_mode text not null default 'true_false',
  session_config jsonb not null default '{}'::jsonb check (jsonb_typeof(session_config) = 'object'),
  created_at timestamptz not null default now()
);
create index game_sessions_owner_started_idx on public.game_sessions (owner_id, started_at desc);
create index game_sessions_game_idx on public.game_sessions (game_id);

create table public.session_answers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  -- set null agar riwayat tetap ada jika soal dihapus; teks soal disalin sebagai snapshot
  question_id uuid references public.questions (id) on delete set null,
  position integer not null default 0,
  question_text text not null,
  correct_answer jsonb,
  given_answer jsonb,
  is_correct boolean not null default false,
  is_timeout boolean not null default false,
  points_earned integer not null default 0 check (points_earned >= 0),
  response_time_ms integer not null default 0 check (response_time_ms >= 0),
  answered_at timestamptz not null default now()
);
create index session_answers_session_idx on public.session_answers (session_id, position);
create index session_answers_owner_idx on public.session_answers (owner_id);

-- ---------------------------------------------------------------------
-- game_shares (token disimpan sebagai hash SHA-256; token asli hanya tampil sekali)
-- ---------------------------------------------------------------------
create table public.game_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  share_token_hash text not null unique,
  permission text not null default 'read_only' check (permission in ('read_only', 'duplicate')),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index game_shares_game_idx on public.game_shares (game_id);
create index game_shares_owner_idx on public.game_shares (owner_id, created_at desc);

-- ---------------------------------------------------------------------
-- achievements
-- ---------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_key text not null check (char_length(achievement_key) <= 60),
  session_id uuid references public.game_sessions (id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  earned_at timestamptz not null default now()
);
create unique index achievements_unique_idx
  on public.achievements (owner_id, achievement_key, coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid));
