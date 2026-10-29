import "server-only";
import { driveApi, driveFolderUrl, sheetsApi, trackerSheetId } from "./google";
import { appendRows } from "./sheet";
import { nowStampET, todayET } from "./dates.ts";
import {
  ACCELERATOR_COLS, ACCELERATOR_SUBFOLDERS, checklistName, clientName, firstMonday, folderName, needsNotifiedShare, type Enrollee,
} from "./accelerator-logic.ts";
import { ACTIVITY_COLS } from "./types.ts";

// Accelerator enrollment: a GoHighLevel workflow calls /api/accelerator/enroll when a client enrolls.
// The client gets a documents folder and their own copy of the 12-week checklist, shared with them,
// and the links go back on their GoHighLevel contact for the welcome email. Safe to call twice.

const TAB = "Accelerator" as const;
const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

function setting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set. See dashboard/.env.example.`);
  return value;
}

export interface EnrollResult {
  created: boolean;
  folderUrl: string;
  checklistUrl: string;
  shared: "silent" | "invited" | "already";
  ghlUpdated: boolean;
}

async function readEnrolled(): Promise<Record<string, string>[]> {
  const api = sheetsApi().spreadsheets;
  const spreadsheetId = trackerSheetId();
  try {
    const res = await api.values.get({ spreadsheetId, range: TAB, valueRenderOption: "FORMATTED_VALUE" });
    const [header = [], ...rows] = (res.data.values ?? []) as string[][];
    if (!header.length) throw new Error("empty");
    return rows.map((r) => Object.fromEntries(header.map((k, i) => [k, r[i] ?? ""])));
  } catch (e) {
    if (!/Unable to parse range|empty/.test((e as Error).message)) throw e;
    // First enrollment: add the tab with its header row.
    const meta = await api.get({ spreadsheetId, fields: "sheets.properties.title" });
    if (!meta.data.sheets?.some((s) => s.properties?.title === TAB)) {
      await api.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] } });
    }
    await api.values.update({ spreadsheetId, range: `${TAB}!A1`, valueInputOption: "RAW", requestBody: { values: [[...ACCELERATOR_COLS]] } });
    return [];
  }
}

/** A folder made for this contact on an earlier call that failed before its tracker row was written. */
async function findFolder(contactId: string, rootId: string): Promise<string | null> {
  const res = await driveApi().files.list({
    q: `'${rootId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='ghlContactId' and value='${contactId.replace(/'/g, "")}' }`,
    fields: "files(id)",
  });
  return res.data.files?.[0]?.id ?? null;
}

async function makeFolder(name: string, parent: string, contactId?: string): Promise<string> {
  const res = await driveApi().files.create({
    requestBody: {
      name, mimeType: "application/vnd.google-apps.folder", parents: [parent],
      ...(contactId ? { appProperties: { ghlContactId: contactId } } : {}),
    },
    fields: "id",
  });
  return res.data.id!;
}

async function findOrCopyChecklist(e: Enrollee, folderId: string): Promise<{ id: string; created: boolean }> {
  const drive = driveApi();
  const existing = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'`,
    fields: "files(id)",
  });
  const found = existing.data.files?.[0]?.id;
  if (found) return { id: found, created: false };
  const copy = await drive.files.copy({
    fileId: setting("ACCELERATOR_CHECKLIST_TEMPLATE_ID"),
    requestBody: { name: checklistName(e), parents: [folderId] },
    fields: "id",
  });
  return { id: copy.data.id!, created: true };
}

async function share(folderId: string, e: Enrollee): Promise<EnrollResult["shared"]> {
  const drive = driveApi();
  const perms = await drive.permissions.list({ fileId: folderId, fields: "permissions(emailAddress)" });
  if (perms.data.permissions?.some((p) => p.emailAddress?.toLowerCase() === e.email)) return "already";
  const requestBody = { type: "user", role: "writer", emailAddress: e.email };
  try {
    // Silent: the GoHighLevel welcome email carries the links.
    await drive.permissions.create({ fileId: folderId, sendNotificationEmail: false, requestBody });
    return "silent";
  } catch (err) {
    if (!needsNotifiedShare((err as Error).message)) throw err;
    await drive.permissions.create({
      fileId: folderId, sendNotificationEmail: true, requestBody,
      emailMessage: `Hi ${e.first}, this is your Accelerator folder. Your 12-week checklist is inside, and you can upload your documents here. – Jasmine`,
    });
    return "invited";
  }
}

/** Puts the links on the contact as custom fields, when a GoHighLevel token with contacts.write is set. */
async function writeBackToGhl(contactId: string, folderUrl: string, checklistUrl: string): Promise<boolean> {
  const token = process.env.GHL_ENROLL_TOKEN?.trim();
  if (!token) return false;
  const res = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      customFields: [
        { key: "accel_checklist_link", field_value: checklistUrl },
        { key: "accel_folder_link", field_value: folderUrl },
      ],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Folder and checklist are ready, but GoHighLevel refused the links (${res.status}).`);
  return true;
}

export async function enroll(e: Enrollee): Promise<EnrollResult> {
  const rootId = setting("ACCELERATOR_DRIVE_ROOT_ID");
  setting("ACCELERATOR_CHECKLIST_TEMPLATE_ID");

  const row = (await readEnrolled()).find((r) => r.ghl_contact_id === e.contactId);
  let folderId = row?.folder_id || (await findFolder(e.contactId, rootId));
  const created = !folderId;
  if (!folderId) {
    folderId = await makeFolder(folderName(e), rootId, e.contactId);
    for (const sub of ACCELERATOR_SUBFOLDERS) await makeFolder(sub, folderId);
  }

  const checklist = await findOrCopyChecklist(e, folderId);
  const startDate = row?.start_date || firstMonday(todayET());
  if (checklist.created) {
    await sheetsApi().spreadsheets.values.batchUpdate({
      spreadsheetId: checklist.id,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          { range: "'Start Here'!B4", values: [[clientName(e)]] },
          { range: "'Start Here'!B5", values: [[startDate]] },
        ],
      },
    });
  }

  const shared = await share(folderId, e);
  const folderUrl = driveFolderUrl(folderId);
  const checklistUrl = sheetUrl(checklist.id);

  if (!row) {
    await appendRows(TAB, ACCELERATOR_COLS, [{
      ghl_contact_id: e.contactId, client: clientName(e), email: e.email, phone: e.phone, enrolled_at: nowStampET(),
      start_date: startDate, folder_id: folderId, checklist_id: checklist.id, shared, status: "Enrolled",
    }]);
    await appendRows("Activity", ACTIVITY_COLS, [{
      at: nowStampET(), deal_id: "accelerator", event: "Accelerator enrollment",
      detail: `${clientName(e)}: folder and checklist created, shared with ${e.email} (${shared})`, source_link: folderUrl, by: "Claude",
    }]);
  }

  const ghlUpdated = await writeBackToGhl(e.contactId, folderUrl, checklistUrl);
  return { created, folderUrl, checklistUrl, shared, ghlUpdated };
}
