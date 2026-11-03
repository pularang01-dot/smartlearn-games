import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { listBank } from "@/features/questions/queries";
import { listPublishedGameOptions, listSubjects } from "@/features/games/queries";
import { BankManager } from "@/components/dashboard/bank-manager";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";

export const metadata = { title: "Bank soal" };

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ q?: string; subject?: string; page?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard/questions");
  const [bank, subjects, games] = await Promise.all([
    listBank(user.id, { q: sp.q, subjectId: sp.subject, page: Number(sp.page) || 1 }),
    listSubjects(),
    listPublishedGameOptions(user.id),
  ]);
  return (
    <>
      <PageHeader title="Bank soal" description="Simpan soal terbaik Anda dan pakai ulang di game mana pun. Soal disalin saat dimasukkan ke game." />
      {bank.rows.length === 0 && !sp.q && !sp.subject && (
        <div className="mb-6"><EmptyState icon={<BookOpen className="h-7 w-7" />} title="Bank soal masih kosong" description="Tambahkan soal secara manual, impor dari CSV, atau gunakan “Simpan ke bank soal” di editor game." /></div>
      )}
      <BankManager rows={bank.rows} subjects={subjects} games={games} />
      <Pagination page={bank.page} total={bank.total} pageSize={bank.pageSize} basePath="/dashboard/questions" params={{ q: sp.q, subject: sp.subject }} />
    </>
  );
}
