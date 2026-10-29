// Pure rules for Accelerator enrollment, kept apart from Google and GoHighLevel calls so they can be tested.

export const ACCELERATOR_COLS = [
  "ghl_contact_id", "client", "email", "phone", "enrolled_at", "start_date", "folder_id", "checklist_id", "shared", "status",
] as const;

/** The client's documents folder. Numbered so they sort in the order the program uses them. */
export const ACCELERATOR_SUBFOLDERS = [
  "1 Money & Pre-Approval",
  "2 Company & Bank",
  "3 Brand & Website",
  "4 Deal Analyses",
  "5 Team & Contracts",
  "6 Closing & Renovation",
] as const;

export interface Enrollee { contactId: string; first: string; last: string; email: string; phone: string }

const text = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");

/**
 * Reads a GoHighLevel workflow webhook. The standard webhook action sends contact fields at the top level
 * (contact_id, first_name, ...); a custom webhook can send them under `contact` or as camelCase.
 */
export function parseEnrollee(body: unknown): Enrollee {
  const top = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const nested = (top.contact && typeof top.contact === "object" ? top.contact : {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = text(top[k]) || text(nested[k]);
      if (v) return v;
    }
    return "";
  };
  let first = pick("first_name", "firstName");
  let last = pick("last_name", "lastName");
  if (!first && !last) [first = "", last = ""] = splitFull(pick("full_name", "fullName", "name"));
  const enrollee = {
    contactId: pick("contact_id", "contactId", "id"),
    first,
    last,
    email: pick("email").toLowerCase(),
    phone: pick("phone"),
  };
  if (!enrollee.contactId) throw new Error("The webhook has no contact_id.");
  if (!enrollee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enrollee.email)) throw new Error("The webhook has no valid email.");
  if (!enrollee.first && !enrollee.last) throw new Error("The webhook has no client name.");
  return enrollee;
}

function splitFull(full: string): [string, string] {
  const parts = full.split(/\s+/).filter(Boolean);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
}

export const clientName = (e: Enrollee) => [e.first, e.last].filter(Boolean).join(" ");

/** `Tiffany Hammond – Accelerator`, matching the `[Name] – [What]` style of the transaction folders. */
export const folderName = (e: Enrollee) => `${clientName(e)} – Accelerator`;
export const checklistName = (e: Enrollee) => `Accelerator 12-Week Checklist – ${clientName(e)}`;

/** The program starts on the first Monday on or after enrollment (the checklist's "first Monday"). */
export function firstMonday(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7));
  return date.toISOString().slice(0, 10);
}

/** Drive refuses a silent share with an address that has no Google account; it must send the invite itself. */
export const needsNotifiedShare = (message: string) => /no Google account|notify people|sendNotificationEmail/i.test(message);
