import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/api/login") return NextResponse.next();

  const isLoginPage = pathname.startsWith("/login");
  const isApiRoute = pathname.startsWith("/api");
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySession(token) : null;

  if (!userId) {
    if (isLoginPage) return NextResponse.next();
    if (isApiRoute) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isLoginPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
