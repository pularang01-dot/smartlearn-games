-- =====================================================================
-- DATA DEMO OPSIONAL (hanya untuk development lokal / akun uji)
-- Jangan dijalankan di akun produksi tanpa persetujuan pemilik akun.
-- Alternatif tanpa SQL: tombol "Buat game contoh" di aplikasi (halaman Buat Game).
--
-- Cara pakai: ganti email di bawah dengan email akun guru yang SUDAH terdaftar,
-- lalu jalankan di SQL Editor Supabase.
-- =====================================================================
do $$
declare
  v_email text := 'GANTI-DENGAN-EMAIL-ANDA@contoh.com';
  v_uid uuid;
  v_game uuid;
  v_subject uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then
    raise notice 'User % tidak ditemukan. Daftar dulu di aplikasi, lalu ganti email pada seed.sql.', v_email;
    return;
  end if;

  select id into v_subject from public.subjects where owner_id is null and name = 'IPA' limit 1;

  insert into public.games (owner_id, title, description, subject_id, grade_level, topic, tags, status, settings, published_at)
  values (v_uid, 'Mengenal Tata Surya', 'Game Benar/Salah tentang planet dan tata surya.', v_subject, 'Kelas 6', 'Tata Surya',
          array['demo','astronomi'], 'published',
          '{"timerEnabled": false, "defaultTimeLimit": 20, "timeoutCountsAsWrong": true, "timeBonusEnabled": false, "comboBonusEnabled": true, "shuffleQuestions": false, "questionLimit": null, "allowGoBack": false, "soundEnabled": true, "showExplanation": true}'::jsonb,
          now())
  returning id into v_game;

  insert into public.questions (owner_id, game_id, question_text, correct_answer, explanation, points, position) values
    (v_uid, v_game, 'Matahari merupakan pusat tata surya.', 'true', 'Benar. Semua planet mengorbit Matahari karena gravitasinya yang sangat besar.', 10, 0),
    (v_uid, v_game, 'Bumi adalah planet terdekat dari Matahari.', 'false', 'Salah. Planet terdekat dari Matahari adalah Merkurius.', 10, 1),
    (v_uid, v_game, 'Bulan merupakan satelit alami Bumi.', 'true', 'Benar. Bulan mengorbit Bumi dan menjadi satu-satunya satelit alami Bumi.', 10, 2),
    (v_uid, v_game, 'Mars dikenal sebagai Planet Merah.', 'true', 'Benar. Permukaan Mars mengandung besi oksida (karat) sehingga tampak kemerahan.', 10, 3),
    (v_uid, v_game, 'Jupiter adalah planet terkecil di tata surya.', 'false', 'Salah. Jupiter adalah planet terbesar; planet terkecil adalah Merkurius.', 10, 4);

  raise notice 'Game demo dibuat untuk %', v_email;
end $$;
