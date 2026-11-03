import { requireUser } from "@/lib/permissions/auth";
import { PreferencesForm } from "@/components/dashboard/settings-forms";

export const metadata = { title: "Preferensi" };

export default async function PreferencesPage() {
  await requireUser("/dashboard/settings/preferences");
  return <PreferencesForm />;
}
