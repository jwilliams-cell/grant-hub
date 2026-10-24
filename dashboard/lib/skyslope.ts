// Copying filed documents to SkySlope (CLAUDE.md section 6). SkySlope uploads anything emailed to a
// file's own address. This is the only email the system may send by itself, and only when Jaz has
// turned AUTO_SEND_SKYSLOPE on in the tracker's Settings tab.

import { buildMime } from "./mime.ts";

export const isSkySlopeAddress = (email: string | null | undefined): email is string =>
  !!email && /^[^\s@]+@skyslope\.com$/i.test(email.trim());

export const autoSendOn = (settings: Record<string, string>) => (settings.AUTO_SEND_SKYSLOPE ?? "").trim().toUpperCase() === "TRUE";

export interface SkySlopeCopy {
  /** send: goes out now. draft: waits in Gmail for Jaz. none: no confirmed address yet. */
  mode: "send" | "draft" | "none";
  to: string;
  raw: string;
}

/**
 * Builds the copy for one document: to the deal's skyslope_email only, subject = filename,
 * empty body, no cc or bcc. Anything short of a confirmed @skyslope.com address never sends.
 */
export function skySlopeCopy(
  dealSkySlopeEmail: string,
  settings: Record<string, string>,
  doc: { filename: string; data: Buffer },
): SkySlopeCopy {
  const to = dealSkySlopeEmail.trim();
  if (!isSkySlopeAddress(to)) return { mode: "none", to: "", raw: "" };
  const raw = buildMime({ to: [to], cc: [], subject: doc.filename, body: "", attachment: { filename: doc.filename, mimeType: "application/pdf", data: doc.data } });
  return { mode: autoSendOn(settings) ? "send" : "draft", to, raw };
}
