import { NextResponse, type NextRequest } from "next/server";

// The dashboard shows client names and creates drafts in Jaz's Gmail, so anything beyond
// localhost needs DASHBOARD_PASSWORD set. Basic auth; the user name is ignored.
export function middleware(req: NextRequest) {
  // The queue worker has its own check (CRON_SECRET or Vercel's cron agent) in its route.
  if (req.nextUrl.pathname === "/api/cron/queue") return NextResponse.next();
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Sign in required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="BuySmart"' } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
