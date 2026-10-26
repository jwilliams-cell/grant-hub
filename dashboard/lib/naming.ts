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

// One Gmail label per file, nested under "Transactions" so they show as folders in Jaz's Gmail sidebar.
// Closed and terminated files move under "Transactions/Closed".
export const GMAIL_LABEL_ROOT = "Transactions";

export function gmailLabelName(address: string, closed = false): string {
  return [GMAIL_LABEL_ROOT, closed ? "Closed" : "", clean(address)].filter(Boolean).join("/");
}

/** Opens a label in Gmail. Gmail writes spaces as "+" in label links. */
export function gmailLabelUrl(label: string): string {
  return `https://mail.google.com/mail/u/0/#label/${encodeURIComponent(label).replace(/%20/g, "+")}`;
}
