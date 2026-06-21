import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isAuthRoute = url.pathname.startsWith("/login") || url.pathname.startsWith("/auth");
  const isPublic = url.pathname === "/" || isAuthRoute;
  const isApp =
    url.pathname.startsWith("/learn") ||
    url.pathname.startsWith("/case") ||
    url.pathname.startsWith("/lesson") ||
    url.pathname.startsWith("/topic") ||
    url.pathname.startsWith("/profile") ||
    url.pathname.startsWith("/leaderboard") ||
    url.pathname.startsWith("/onboarding");

  if (!user && isApp) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthRoute && url.pathname !== "/auth/callback") {
    const redirect = url.clone();
    redirect.pathname = "/learn";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|workbox-).*)"],
};
