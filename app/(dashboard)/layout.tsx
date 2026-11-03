import { DashboardShell } from "@/components/dashboard/shell";
import { getProfile, requireUser } from "@/lib/permissions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const profile = await getProfile();
  return (
    <DashboardShell displayName={profile?.display_name ?? ""} email={user.email ?? ""} showOnboarding={!profile?.preferences?.onboardingDone}>
      {children}
    </DashboardShell>
  );
}
