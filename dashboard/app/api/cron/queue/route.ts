import { NextResponse } from "next/server";
import { processQueue } from "@/lib/queue";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Vercel Cron calls this every 5 minutes (vercel.json). With CRON_SECRET set in Vercel, Vercel sends it as a
// bearer token and nothing else gets in. Without it, only Vercel's cron user agent is let through; the worst a
// stray call can do is run queued rows early, since the rows themselves come from the tracker.
function allowed(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  return (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
}

export async function GET(req: Request) {
  if (!allowed(req)) return new NextResponse("Not allowed", { status: 401 });
  try {
    return NextResponse.json(await processQueue());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
