-- =====================================================================
-- SmartLearn Games — 0004: fungsi RPC
-- =====================================================================

-- ---------------------------------------------------------------------
-- Urutkan ulang soal dalam satu statement (atomik). SECURITY INVOKER => RLS berlaku.
-- ---------------------------------------------------------------------
create or replace function public.reorder_questions(p_game_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.questions q
     set position = t.ord - 1
    from unnest(p_ids) with ordinality as t(id, ord)
   where q.id = t.id and q.game_id = p_game_id;
$$;

-- ---------------------------------------------------------------------
-- Simpan sesi + jawaban + pencapaian dalam SATU transaksi (satu panggilan fungsi).
-- Idempoten: id sesi dibuat klien; panggilan ulang dengan id sama tidak menggandakan data.
-- SECURITY INVOKER => RLS memastikan game milik pemanggil.
-- Nilai skor dihitung ulang oleh server action Next.js sebelum fungsi ini dipanggil.
-- ---------------------------------------------------------------------
create or replace function public.save_game_session(
  p_session jsonb,
  p_answers jsonb,
  p_achievements jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := (p_session ->> 'id')::uuid;
  v_game uuid := (p_session ->> 'game_id')::uuid;
  v_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Tidak terautentikasi' using errcode = '28000';
  end if;

  insert into public.game_sessions (
    id, owner_id, game_id, session_label, status, started_at, completed_at,
    total_questions, total_score, correct_count, incorrect_count, timeout_count,
    accuracy, duration_seconds, game_mode, session_config
  ) values (
    v_id, auth.uid(), v_game,
    nullif(left(p_session ->> 'session_label', 80), ''),
    p_session ->> 'status',
    (p_session ->> 'started_at')::timestamptz,
    (p_session ->> 'completed_at')::timestamptz,
    (p_session ->> 'total_questions')::integer,
    (p_session ->> 'total_score')::integer,
    (p_session ->> 'correct_count')::integer,
    (p_session ->> 'incorrect_count')::integer,
    (p_session ->> 'timeout_count')::integer,
    (p_session ->> 'accuracy')::numeric,
    (p_session ->> 'duration_seconds')::integer,
    coalesce(p_session ->> 'game_mode', 'true_false'),
    coalesce(p_session -> 'session_config', '{}'::jsonb)
  )
  on conflict (id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return jsonb_build_object('duplicate', true, 'id', v_id);
  end if;

  insert into public.session_answers (
    owner_id, session_id, question_id, position, question_text, correct_answer,
    given_answer, is_correct, is_timeout, points_earned, response_time_ms, answered_at
  )
  select auth.uid(), v_id, a.question_id, a.position, a.question_text, a.correct_answer,
         a.given_answer, a.is_correct, a.is_timeout, a.points_earned, a.response_time_ms,
         coalesce(a.answered_at, now())
    from jsonb_to_recordset(coalesce(p_answers, '[]'::jsonb)) as a(
      question_id uuid, position integer, question_text text, correct_answer jsonb,
      given_answer jsonb, is_correct boolean, is_timeout boolean, points_earned integer,
      response_time_ms integer, answered_at timestamptz
    );

  insert into public.achievements (owner_id, achievement_key, session_id, metadata)
  select auth.uid(), x.key, v_id, coalesce(x.metadata, '{}'::jsonb)
    from jsonb_to_recordset(coalesce(p_achievements, '[]'::jsonb)) as x(key text, metadata jsonb)
  on conflict do nothing;

  update public.games set last_played_at = now() where id = v_game;

  return jsonb_build_object('duplicate', false, 'id', v_id);
end;
$$;

-- ---------------------------------------------------------------------
-- Akses publik ke game yang dibagikan. SECURITY DEFINER karena pemanggil (anon) tidak punya
-- akses tabel. Fungsi hanya mengembalikan field yang aman: tanpa owner_id/email/data sesi.
-- ---------------------------------------------------------------------
create or replace function public.get_shared_game(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_share record;
  v_game record;
  v_questions jsonb;
  v_subject text;
begin
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 100 then
    return null;
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select s.* into v_share
    from public.game_shares s
   where s.share_token_hash = v_hash
     and s.revoked_at is null
     and (s.expires_at is null or s.expires_at > now());
  if not found then return null; end if;

  select g.* into v_game from public.games g where g.id = v_share.game_id and g.status = 'published';
  if not found then return null; end if;

  select name into v_subject from public.subjects where id = v_game.subject_id;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', q.id, 'question_text', q.question_text, 'correct_answer', q.correct_answer,
             'explanation', q.explanation, 'image_path', q.image_path, 'points', q.points,
             'time_limit_seconds', q.time_limit_seconds, 'is_required', q.is_required,
             'position', q.position
           ) order by q.position, q.created_at), '[]'::jsonb)
    into v_questions
    from public.questions q where q.game_id = v_game.id;

  return jsonb_build_object(
    'permission', v_share.permission,
    'game', jsonb_build_object(
      'id', v_game.id, 'title', v_game.title, 'description', v_game.description,
      'grade_level', v_game.grade_level, 'topic', v_game.topic, 'settings', v_game.settings,
      'game_mode', v_game.game_mode, 'cover_image_path', v_game.cover_image_path,
      'subject_name', v_subject
    ),
    'questions', v_questions
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Duplikat game yang dibagikan (permission = 'duplicate') ke workspace pemanggil.
-- Gambar TIDAK disalin (path-nya milik folder pemilik asli).
-- ---------------------------------------------------------------------
create or replace function public.duplicate_shared_game(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_share record;
  v_game record;
  v_new uuid;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu' using errcode = '28000';
  end if;
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 100 then
    raise exception 'Tautan tidak valid' using errcode = 'P0002';
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select s.* into v_share from public.game_shares s
   where s.share_token_hash = v_hash and s.revoked_at is null
     and (s.expires_at is null or s.expires_at > now());
  if not found or v_share.permission <> 'duplicate' then
    raise exception 'Tautan tidak mengizinkan duplikasi' using errcode = 'P0002';
  end if;

  select g.* into v_game from public.games g where g.id = v_share.game_id and g.status = 'published';
  if not found then
    raise exception 'Game tidak tersedia' using errcode = 'P0002';
  end if;

  insert into public.games (owner_id, title, description, subject_id, grade_level, topic, tags, game_mode, status, settings)
  values (
    v_uid, left(v_game.title || ' (salinan)', 120), v_game.description,
    (select s.id from public.subjects s where s.id = v_game.subject_id and s.owner_id is null),
    v_game.grade_level, v_game.topic, v_game.tags, v_game.game_mode, 'draft', v_game.settings
  ) returning id into v_new;

  insert into public.questions (owner_id, game_id, question_text, answer_type, correct_answer, explanation, points, time_limit_seconds, is_required, position)
  select v_uid, v_new, q.question_text, q.answer_type, q.correct_answer, q.explanation, q.points, q.time_limit_seconds, q.is_required, q.position
    from public.questions q where q.game_id = v_game.id;

  return v_new;
end;
$$;

-- Hak eksekusi: cabut default PUBLIC lalu berikan seperlunya.
revoke all on function public.get_shared_game(text) from public;
revoke all on function public.duplicate_shared_game(text) from public;
revoke all on function public.save_game_session(jsonb, jsonb, jsonb) from public;
revoke all on function public.reorder_questions(uuid, uuid[]) from public;

grant execute on function public.get_shared_game(text) to anon, authenticated;
grant execute on function public.duplicate_shared_game(text) to authenticated;
grant execute on function public.save_game_session(jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.reorder_questions(uuid, uuid[]) to authenticated;
