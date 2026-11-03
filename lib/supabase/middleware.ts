import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

function redirectWithCookies(request: NextRequest, source: NextResponse, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

/** Refresh sesi Supabase di setiap request dan lindungi route privat. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response; // halaman akan menampilkan pesan konfigurasi

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPrivate = path.startsWith("/dashboard") || path.startsWith("/play");

  if (!user && isPrivate) {
    const next = encodeURIComponent(path + request.nextUrl.search);
    return redirectWithCookies(request, response, "/login", `?next=${next}`);
  }
  if (user && AUTH_PAGES.includes(path)) {
    return redirectWithCookies(request, response, "/dashboard");
  }
  return response;
}