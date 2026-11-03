import Link from "next/link";
import { PageHeader } from "@/components/ui/misc";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Pengaturan" />
      <nav aria-label="Pengaturan" className="mb-6 flex gap-2">
        <Link href="/dashboard/settings/profile" className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-paper">Profil</Link>
        <Link href="/dashboard/settings/preferences" className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-paper">Preferensi</Link>
      </nav>
      <div className="max-w-2xl">{children}</div>
    </>
  );
}
