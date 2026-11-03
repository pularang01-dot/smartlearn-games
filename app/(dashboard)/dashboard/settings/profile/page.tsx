import { getProfile, requireUser } from "@/lib/permissions/auth";
import { ProfileForm } from "@/components/dashboard/settings-forms";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/settings/profile");
  const profile = await getProfile();
  return <ProfileForm displayName={profile?.display_name ?? ""} email={user.email ?? ""} />;
}
