// Pure rules for the Queue tab, kept apart from Google calls so they can be tested.

import { SUBFOLDERS, type QueueRow } from "./types.ts";

export interface MessagePart {
  filename?: string | null;
  mimeType?: string | null;
  body?: { attachmentId?: string | null; size?: number | null } | null;
  parts?: MessagePart[] | null;
}

export interface FoundAttachment { filename: string; mimeType: string; attachmentId: string; size: number }

/** Every real attachment in a Gmail message, skipping signature images (image00x under 50 KB). */
export function listAttachments(part: MessagePart | null | undefined): FoundAttachment[] {
  if (!part) return [];
  const own: FoundAttachment[] = part.filename && part.body?.attachmentId
    ? [{ filename: part.filename, mimeType: part.mimeType ?? "application/octet-stream", attachmentId: part.body.attachmentId, size: part.body.size ?? 0 }]
    : [];
  const all = [...own, ...(part.parts ?? []).flatMap(listAttachments)];
  return all.filter((a) => !(/^image\d*\.(png|jpe?g|gif)$/i.test(a.filename) && a.size < 50_000));
}

/** The named attachment, or the only PDF when no name is given. Never guesses between several PDFs. */
export function pickAttachment(found: FoundAttachment[], name: string): FoundAttachment {
  const wanted = name.trim();
  if (wanted) {
    const hit = found.find((a) => a.filename === wanted) ?? found.find((a) => a.filename.toLowerCase() === wanted.toLowerCase());
    if (!hit) throw new Error(`No attachment named "${wanted}". Found: ${found.map((a) => a.filename).join(", ") || "none"}`);
    return hit;
  }
  const pdfs = found.filter((a) => /\.pdf$/i.test(a.filename) || a.mimeType === "application/pdf");
  if (pdfs.length !== 1) throw new Error(`Name the attachment: the email has ${pdfs.length} PDFs (${pdfs.map((a) => a.filename).join(", ") || "none"}).`);
  return pdfs[0];
}

export const splitEmails = (list: string) => list.split(/[,;]/).map((e) => e.trim()).filter(Boolean);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Checks a row before any Google call. Returns the problem, or "" when the row can run. */
export function validateQueueRow(row: QueueRow): string {
  if (!row.deal_id) return "deal_id is empty";
  if (!row.gmail_message_id) return "gmail_message_id is empty";
  if (row.action === "draft") {
    const to = splitEmails(row.to);
    if (!to.length) return "draft needs a to address";
    const bad = [...to, ...splitEmails(row.cc)].find((e) => !EMAIL.test(e));
    if (bad) return `"${bad}" isn't an email address`;
    if (!row.subject.trim()) return "draft needs a subject";
    return "";
  }
  if (row.action === "skyslope") {
    if (!/\.pdf$/.test(row.filename)) return "skyslope needs the filed document's filename";
    return "";
  }
  if (row.action === "file") {
    if (!(SUBFOLDERS as readonly string[]).includes(row.drive_subfolder)) return `drive_subfolder must be one of: ${SUBFOLDERS.join(", ")}`;
    if (!/ – .+ – .+ – (\d{4}-\d{2}-\d{2}|date to confirm)\.pdf$/.test(row.filename)) return "filename must follow [Address] – [Client last name] – [Document] – [YYYY-MM-DD].pdf";
    return "";
  }
  return `unknown action "${row.action}" (use draft, file or skyslope)`;
}
