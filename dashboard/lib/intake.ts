import "server-only";
import { Readable } from "node:stream";
import {
  appUrl, calendarApi, driveApi, driveFileUrl, driveFolderUrl, driveRootId, gmailApi, gmailDraftUrl,
} from "./google";
import { appendRows, readTracker } from "./sheet";
import { buildMime } from "./mime.ts";
import { addDays, nowStampET } from "./dates.ts";
import type { IntakePlan } from "./plan.ts";
import {
  ACTIVITY_COLS, DEAL_COLS, DOCUMENT_COLS, DRAFT_COLS, MILESTONE_COLS, SUBFOLDERS,
  type Activity, type Draft, type Milestone,
} from "./types.ts";

export interface IntakeResult {
  dealId: string;
  folderUrl?: string;
  contractUrl?: string;
  events: { step: string; due: string; id: string }[];
  drafts: { subject: string; to: string; url: string }[];
  warnings: string[];
  errors: string[];
}

const FOLDER = "application/vnd.google-apps.folder";

async function createFolder(name: string, parent: string): Promise<string> {
  const res = await driveApi().files.create({
    requestBody: { name, mimeType: FOLDER, parents: [parent] },
    fields: "id",
    supportsAllDrives: true,
  });
  return res.data.id!;
}

/**
 * Creates the client file from a plan Jaz approved. Nothing here sends email or invites anyone:
 * events go on Jaz's own calendar with no attendees, and every email is a Gmail draft.
 */
export async function runIntake(plan: IntakePlan, pdf: Buffer): Promise<IntakeResult> {
  const result: IntakeResult = { dealId: plan.dealId, events: [], drafts: [], warnings: [...plan.warnings], errors: [] };
  const at = nowStampET();

  const tracker = await readTracker();
  if (tracker.deals.some((d) => d.deal_id === plan.dealId || d.address.toLowerCase() === plan.deal.address.toLowerCase())) {
    throw new Error(`${plan.deal.address} is already in the tracker. Nothing was created.`);
  }

  // 1. Drive: the client folder, its six subfolders, and the contract in "1 Contract & Addenda".
  const folderId = await createFolder(plan.folderName, driveRootId());
  result.folderUrl = driveFolderUrl(folderId);
  const subfolderIds: string[] = [];
  for (const name of SUBFOLDERS) subfolderIds.push(await createFolder(name, folderId));
  const upload = await driveApi().files.create({
    requestBody: { name: plan.contractFilename, parents: [subfolderIds[0]], mimeType: "application/pdf" },
    media: { mimeType: "application/pdf", body: Readable.from(pdf) },
    fields: "id",
    supportsAllDrives: true,
  });
  const contractId = upload.data.id!;
  result.contractUrl = driveFileUrl(contractId);

  // 2. Calendar: one all-day event per dated deadline, on Jaz's primary calendar only.
  const dealLink = `${appUrl()}/files/${plan.dealId}`;
  const milestoneRows: Partial<Milestone>[] = [];
  for (const m of plan.milestones) {
    let eventId = "";
    if (m.calendar) {
      try {
        const ev = await calendarApi().events.insert({
          calendarId: "primary",
          sendUpdates: "none",
          requestBody: {
            summary: `${plan.deal.address} – ${m.step}`,
            description: `Client: ${plan.deal.client}\nDrive folder: ${result.folderUrl}\nDashboard: ${dealLink}${m.note ? `\n\n${m.note}` : ""}`,
            start: { date: m.due },
            end: { date: addDays(m.due, 1) },
            transparency: "transparent",
            // All-day reminders count back from midnight: 2,340 minutes is 9am two days before,
            // and 900 minutes is 9am the day before (Google can't remind after an all-day event starts).
            reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 2340 }, { method: "popup", minutes: 900 }] },
            extendedProperties: { private: { buysmart_deal: plan.dealId, buysmart_seq: m.seq } },
          },
        });
        eventId = ev.data.id ?? "";
        result.events.push({ step: m.step, due: m.due, id: eventId });
      } catch (e) {
        result.errors.push(`Calendar event for "${m.step}" failed: ${(e as Error).message}`);
      }
    }
    const { calendar: _calendar, ...row } = m;
    milestoneRows.push({ ...row, calendar_event_id: eventId, source_link: m.seq === "1" ? result.contractUrl : "" });
  }

  // 3. Gmail drafts. Never sent from here.
  const draftRows: Partial<Draft>[] = [];
  for (const draft of plan.drafts) {
    try {
      const raw = buildMime({
        to: draft.to, cc: draft.cc, subject: draft.subject, body: draft.body,
        attachment: draft.attachContract ? { filename: plan.contractFilename, mimeType: "application/pdf", data: pdf } : undefined,
      });
      const res = await gmailApi().users.drafts.create({ userId: "me", requestBody: { message: { raw } } });
      const messageId = res.data.message?.id ?? "";
      result.drafts.push({ subject: draft.subject, to: draft.to.join(", "), url: gmailDraftUrl(messageId) });
      draftRows.push({
        deal_id: plan.dealId, to: [...draft.to, ...draft.cc].join(", "), subject: draft.subject,
        gmail_draft_id: res.data.id ?? "", reason: draft.reason, created_at: at, status: "Waiting for Jaz", gmail_message_id: messageId,
      });
    } catch (e) {
      result.errors.push(`Draft "${draft.subject}" failed: ${(e as Error).message}`);
    }
  }

  // 4. The Sheet, last, so the dashboard only shows a file once its folder exists.
  const activity: Partial<Activity>[] = [
    { at, deal_id: plan.dealId, event: "New contract", detail: `File created from the Agreement of Sale after Jaz confirmed the dates`, source_link: result.contractUrl, by: "Jaz" },
    { at, deal_id: plan.dealId, event: "Drive folder created", detail: plan.folderName, source_link: result.folderUrl, by: "Claude" },
    { at, deal_id: plan.dealId, event: "Calendar events added", detail: `${result.events.length} deadlines on Jaz's calendar`, source_link: "", by: "Claude" },
    { at, deal_id: plan.dealId, event: "Drafts created", detail: result.drafts.map((d) => d.subject).join("; ") || "None", source_link: "", by: "Claude" },
    ...result.errors.map((err) => ({ at, deal_id: plan.dealId, event: "Intake problem", detail: err, source_link: "", by: "Claude" })),
  ];
  await appendRows("Deals", DEAL_COLS, [{ ...plan.deal, drive_folder_id: folderId }]);
  await appendRows("Milestones", MILESTONE_COLS, milestoneRows);
  await appendRows("Documents", DOCUMENT_COLS, [{
    deal_id: plan.dealId, filename: plan.contractFilename, drive_file_id: contractId, drive_subfolder: SUBFOLDERS[0],
    received_from: "Jaz (dashboard upload)", received_at: at, skyslope_sent_at: "", gmail_message_id: "",
  }]);
  await appendRows("Drafts", DRAFT_COLS, draftRows);
  await appendRows("Activity", ACTIVITY_COLS, activity);

  result.warnings.push("SkySlope: confirm this file's SkySlope email address, then the contract can be copied there.");
  return result;
}
