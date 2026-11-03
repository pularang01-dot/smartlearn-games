import { Logo } from "@/components/ui/logo";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-sm sm:p-8">
        {!hasSupabaseEnv() && (
          <p role="alert" className="mb-4 rounded-xl border border-pencil-300 bg-pencil-100 px-4 py-3 text-sm text-[#7A5600]">
            Supabase belum dikonfigurasi. Isi <code>.env.local</code> sesuai <code>docs/SUPABASE_SETUP.md</code> lalu restart server.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
