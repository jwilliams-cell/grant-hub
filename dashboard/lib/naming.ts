// One naming rule for every document filed to Drive and copied to SkySlope (CLAUDE.md section 4):
//   [Address] – [Client last name] – [Document] – [YYYY-MM-DD].pdf
// e.g. "532 Waterside Cir L-0133 – Martin – Agreement of Sale – 2026-10-23.pdf"

import { isISODate } from "./dates.ts";

/** Drops characters Drive and email attachments handle badly, and collapses spaces. */
function clean(part: string): string {
  return part.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
}

export function documentFilename(parts: { address: string; clientLastName: string; document: string; date: string | null }): string {
  const date = isISODate(parts.date) ? parts.date : "date to confirm";
  return [clean(parts.address), clean(parts.clientLastName) || "Client", clean(parts.document), date].join(" – ") + ".pdf";
}
