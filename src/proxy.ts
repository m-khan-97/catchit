import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Supabase's magic-link verify endpoint has been observed dropping the
  // /auth/callback path from our redirect_to and falling back to the bare
  // Site URL, stranding users on the homepage with the auth code unused in
  // the query string (support ticket open with Supabase). Forward that
  // code to the callback route so the emailed link still signs people in.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", searchParams.get("code")!);
    callbackUrl.searchParams.set("next", "/account");
    return NextResponse.redirect(callbackUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, so the auth cookie
     * stays fresh everywhere, while keeping the admin-route gate cheap.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
