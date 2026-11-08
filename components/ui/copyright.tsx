import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { copyrightYears, DEVELOPER } from "@/lib/constants/developer";

/** Baris hak cipta standar yang dipakai di footer semua halaman. */
export function Copyright({ className }: { className?: string }) {
  return (
    <p className={className}>
      © {copyrightYears()} {APP_NAME}. Hak cipta dilindungi. Dikembangkan oleh{" "}
      <Link href="/developer" className="font-semibold hover:text-brand-600 hover:underline">{DEVELOPER.name}</Link>.
    </p>
  );
}