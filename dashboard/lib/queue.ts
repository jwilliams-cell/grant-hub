import "server-only";
import { Readable } from "node:stream";
import { driveApi, driveFileUrl, gmailApi, sheetsApi, trackerSheetId } from "./google";
import { appendRows, readTracker } from "./sheet";
import { buildMime } from "./mime.ts";
import { skySlopeCopy } from "./skyslope.ts";
import { nowStampET } from "./dates.ts";
import { listAttachments, pickAttachment, splitEmails, validateQueueRow } from "./queue-logic.ts";
import { ACTIVITY_COLS, DOCUMENT_COLS, DRAFT_COLS, QUEUE_COLS, type QueueRow, type Tracker } from "./types.ts";

const MAX_PER_RUN = 5;
const gmailLink = (messageId: string) => `https://mail.google.com/mail/u/0/#all/${messageId}`;

async function readQueue(): Promise<{ row: QueueRow; sheetRow: number }[]> {
  const res = await sheetsApi().spreadsheets.values.get({ spreadsheetId: trackerSheetId(), range: "Queue", valueRenderOption: "FORMATTED_VALUE" });
  const [header = [], ...rows] = (res.data.values ?? []) as string[][];
  return rows.map((r, i) => ({
    row: Object.fromEntries(QUEUE_COLS.map((c) => [c, String(r[header.indexOf(c)] ?? "").trim()])) as QueueRow,
    sheetRow: i + 2,
  }));
}

async function finish(sheetRow: number, status: "Done" | "Error", result: string) {
  const first = QUEUE_COLS.indexOf("status");
  const col = (i: number) => String.fromCharCode(65 + i);
  await sheetsApi().spreadsheets.values.update({
    spreadsheetId: trackerSheetId(),
    range: `Queue!${col(first)}${sheetRow}:${col(first + 2)}${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status, result.slice(0, 500), nowStampET()]] },
  });
}

async function fetchAttachment(messageId: string, name: string) {
  const msg = await gmailApi().users.messages.get({ userId: "me", id: messageId, format: "full" });
  const found = pickAttachment(listAttachments(msg.data.payload), name);
  const att = await gmailApi().users.messages.attachments.get({ userId: "me", messageId, id: found.attachmentId });
  return { ...found, data: Buffer.from(att.data.data ?? "", "base64url") };
}

/** A Gmail draft with the PDF attached. Never sent. */
async function runDraft(row: QueueRow, at: string): Promise<string> {
  const pdf = await fetchAttachment(row.gmail_message_id, row.attachment);
  const filename = row.filename || pdf.filename;
  const to = splitEmails(row.to);
  const cc = splitEmails(row.cc);
  const raw = buildMime({ to, cc, subject: row.subject, body: row.body.replace(/\\n/g, "\n"), attachment: { filename, mimeType: pdf.mimeType, data: pdf.data } });
  const res = await gmailApi().users.drafts.create({ userId: "me", requestBody: { message: { raw } } });
  const messageId = res.data.message?.id ?? "";
  await appendRows("Drafts", DRAFT_COLS, [{
    deal_id: row.deal_id, to: [...to, ...cc].join(", "), subject: row.subject, gmail_draft_id: res.data.id ?? "",
    reason: row.reason || "Drafted with an attachment from Gmail", created_at: at, status: "Waiting for Jaz", gmail_message_id: messageId,
  }]);
  await appendRows("Activity", ACTIVITY_COLS, [{
    at, deal_id: row.deal_id, event: "Draft created", detail: `${row.subject} to ${to.join(", ")}, with ${filename} attached`, source_link: gmailLink(row.gmail_message_id), by: "Claude",
  }]);
  return `Draft ${res.data.id} with ${filename} (${Math.round(pdf.data.length / 1024)} KB)`;
}

async function subfolderId(folderId: string, name: string): Promise<string> {
  const res = await driveApi().files.list({
    q: `'${folderId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)", supportsAllDrives: true, includeItemsFromAllDrives: true,
  });
  const id = res.data.files?.[0]?.id;
  if (id) return id;
  const made = await driveApi().files.create({ requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [folderId] }, fields: "id", supportsAllDrives: true });
  return made.data.id!;
}

/** Saves the PDF to the deal's Drive subfolder, lists it in Documents and copies it to SkySlope. */
async function runFile(row: QueueRow, at: string, tracker: Tracker): Promise<string> {
  const deal = tracker.deals.find((d) => d.deal_id === row.deal_id);
  if (!deal?.drive_folder_id) throw new Error(`${row.deal_id} has no Drive folder in the tracker`);
  if (tracker.documents.some((d) => d.deal_id === row.deal_id && d.filename === row.filename)) return "Already filed; skipped";
  const pdf = await fetchAttachment(row.gmail_message_id, row.attachment);
  const parent = await subfolderId(deal.drive_folder_id, row.drive_subfolder);
  const up = await driveApi().files.create({
    requestBody: { name: row.filename, parents: [parent], mimeType: "application/pdf" },
    media: { mimeType: "application/pdf", body: Readable.from(pdf.data) },
    fields: "id", supportsAllDrives: true,
  });
  const fileId = up.data.id!;

  // SkySlope: sent only with AUTO_SEND_SKYSLOPE on and a confirmed @skyslope.com address; otherwise a draft.
  let skyslopeSentAt = "";
  let skyslopeNote = "no confirmed SkySlope address";
  const copy = skySlopeCopy(deal.skyslope_email, tracker.settings, { filename: row.filename, data: pdf.data });
  if (copy.mode === "send") {
    await gmailApi().users.messages.send({ userId: "me", requestBody: { raw: copy.raw } });
    skyslopeSentAt = at;
    skyslopeNote = `sent to ${copy.to}`;
  } else if (copy.mode === "draft") {
    const res = await gmailApi().users.drafts.create({ userId: "me", requestBody: { message: { raw: copy.raw } } });
    await appendRows("Drafts", DRAFT_COLS, [{
      deal_id: row.deal_id, to: copy.to, subject: row.filename, gmail_draft_id: res.data.id ?? "", reason: "Copy to SkySlope for compliance",
      created_at: at, status: "Waiting for Jaz", gmail_message_id: res.data.message?.id ?? "",
    }]);
    skyslopeNote = `drafted to ${copy.to}`;
  }

  await appendRows("Documents", DOCUMENT_COLS, [{
    deal_id: row.deal_id, filename: row.filename, drive_file_id: fileId, drive_subfolder: row.drive_subfolder,
    received_from: row.reason || "Gmail", received_at: at, skyslope_sent_at: skyslopeSentAt, gmail_message_id: row.gmail_message_id,
  }]);
  await appendRows("Activity", ACTIVITY_COLS, [{
    at, deal_id: row.deal_id, event: "Document filed", detail: `${row.filename} in ${row.drive_subfolder}; SkySlope ${skyslopeNote}`, source_link: driveFileUrl(fileId), by: "Claude",
  }]);
  return `Filed ${driveFileUrl(fileId)}; SkySlope ${skyslopeNote}`;
}

/** Copies a document that's already filed to the deal's SkySlope address (once an address is confirmed). */
async function runSkySlope(row: QueueRow, at: string, tracker: Tracker): Promise<string> {
  const deal = tracker.deals.find((d) => d.deal_id === row.deal_id);
  if (!deal) throw new Error(`${row.deal_id} isn't in the tracker`);
  const pdf = await fetchAttachment(row.gmail_message_id, row.attachment);
  const copy = skySlopeCopy(deal.skyslope_email, tracker.settings, { filename: row.filename, data: pdf.data });
  if (copy.mode === "none") throw new Error("No confirmed @skyslope.com address on this deal");
  if (copy.mode === "send") {
    await gmailApi().users.messages.send({ userId: "me", requestBody: { raw: copy.raw } });
  } else {
    const res = await gmailApi().users.drafts.create({ userId: "me", requestBody: { message: { raw: copy.raw } } });
    await appendRows("Drafts", DRAFT_COLS, [{
      deal_id: row.deal_id, to: copy.to, subject: row.filename, gmail_draft_id: res.data.id ?? "", reason: "Copy to SkySlope for compliance",
      created_at: at, status: "Waiting for Jaz", gmail_message_id: res.data.message?.id ?? "",
    }]);
  }
  const note = copy.mode === "send" ? `sent to ${copy.to}` : `drafted to ${copy.to}`;
  await appendRows("Activity", ACTIVITY_COLS, [{
    at, deal_id: row.deal_id, event: "Copied to SkySlope", detail: `${row.filename} ${note}`, source_link: gmailLink(row.gmail_message_id), by: "Claude",
  }]);
  return `SkySlope ${note}`;
}

/** Runs up to MAX_PER_RUN pending rows. Each row's outcome is written back to the Queue tab. */
export async function processQueue(): Promise<{ done: number; errors: number; pending: number }> {
  const queue = await readQueue();
  const pending = queue.filter((q) => q.row.id && (!q.row.status || q.row.status === "Pending"));
  const tracker = await readTracker();
  let done = 0;
  let errors = 0;
  for (const { row, sheetRow } of pending.slice(0, MAX_PER_RUN)) {
    const at = nowStampET();
    try {
      const problem = validateQueueRow(row);
      if (problem) throw new Error(problem);
      const result = row.action === "draft" ? await runDraft(row, at)
        : row.action === "skyslope" ? await runSkySlope(row, at, tracker)
        : await runFile(row, at, tracker);
      await finish(sheetRow, "Done", result);
      done++;
    } catch (e) {
      await finish(sheetRow, "Error", (e as Error).message);
      errors++;
    }
  }
  return { done, errors, pending: Math.max(0, pending.length - MAX_PER_RUN) };
}
