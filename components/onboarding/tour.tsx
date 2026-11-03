"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { updatePreferences } from "@/features/profile/actions";

const STEPS = [
  { title: "Selamat datang di SmartLearn Games", body: "Dalam beberapa langkah singkat, Anda akan tahu cara membuat game Benar/Salah dan memainkannya di Smartboard." },
  { title: "Area dashboard", body: "Menu di sebelah kiri membawa Anda ke Game saya, Bank soal, Riwayat sesi, Laporan, dan Panduan. Di kanan atas ada profil dan tombol keluar." },
  { title: "Cara membuat game", body: "Buka Game saya lalu klik Buat game baru. Isi judul, mata pelajaran, dan kelas. Atau coba tombol Buat game contoh untuk melihat hasil jadi." },
  { title: "Cara menambah pertanyaan", body: "Di editor, klik Tambah pertanyaan. Tulis pernyataan, pilih jawaban Benar atau Salah, dan isi penjelasan. Perubahan tersimpan otomatis. Anda juga bisa impor dari CSV atau ambil dari Bank soal." },
  { title: "Cara preview", body: "Klik Preview di editor untuk mencoba game tanpa menyimpan hasil. Tombol Mainkan dipakai untuk sesi kelas yang sebenarnya." },
  { title: "Cara memulai di Smartboard", body: "Klik Mainkan, aktifkan layar penuh, lalu minta siswa menyentuh panel hijau (Benar) atau merah (Salah). Toolbar guru di atas dapat disembunyikan." },
  { title: "Cara melihat hasil", body: "Setelah sesi selesai, hasilnya tersimpan otomatis. Lihat di Riwayat sesi atau Laporan, dan ekspor ke CSV bila perlu." },
];

const SNOOZE_KEY = "slg:tour-snoozed";

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try { if (sessionStorage.getItem(SNOOZE_KEY) !== "1") setOpen(true); } catch { setOpen(true); }
  }, []);

  const finishForever = () => {
    setOpen(false);
    void updatePreferences({ onboardingDone: true });
  };
  const later = () => {
    setOpen(false);
    try { sessionStorage.setItem(SNOOZE_KEY, "1"); } catch { /* abaikan */ }
  };

  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <Modal
      open={open}
      onClose={later}
      title={s.title}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={finishForever}>Lewati</Button>
          <Button variant="secondary" onClick={later}>Lihat lagi nanti</Button>
          {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Kembali</Button>}
          {last ? <Button onClick={finishForever}>Selesai</Button> : <Button onClick={() => setStep(step + 1)} data-autofocus>Lanjut</Button>}
        </>
      }
    >
      <p className="text-ink-soft">{s.body}</p>
      <p className="mt-4 text-xs font-semibold text-ink-mute" aria-live="polite">Langkah {step + 1} dari {STEPS.length}</p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {STEPS.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-line"}`} />)}
      </div>
    </Modal>
  );
}
