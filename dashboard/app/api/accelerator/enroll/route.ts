import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { enroll } from "@/lib/accelerator";
import { parseEnrollee } from "@/lib/accelerator-logic";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// GoHighLevel's workflow webhook calls this when a client enrolls in the Accelerator. It skips the dashboard
// password, so it needs ACCELERATOR_WEBHOOK_SECRET: sent as the x-webhook-secret header, or as ?key= for
// GoHighLevel's plain Webhook action, which can't set headers.
function allowed(req: Request): boolean {
  const secret = process.env.ACCELERATOR_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const given = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!allowed(req)) return new NextResponse("Not allowed", { status: 401 });
  try {
    const enrollee = parseEnrollee(await req.json().catch(() => null));
    return NextResponse.json(await enroll(enrollee));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
