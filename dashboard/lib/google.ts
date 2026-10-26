import "server-only";
import { google } from "googleapis";

// One OAuth client for Jaz's own Google account: Sheets, Drive, Calendar, Gmail drafts, and Gmail read
// (read only, so the server can copy lender and title PDFs into drafts, Drive and SkySlope at any size).
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.readonly",
];

function required(name: string): string {
  // Pasted values often carry a trailing space or newline, which Google rejects as invalid_client.
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set. See dashboard/.env.example.`);
  return value;
}

let auth: InstanceType<typeof google.auth.OAuth2> | null = null;

function getAuth() {
  if (!auth) {
    // Name every missing setting at once, so one redeploy fixes them all.
    const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "TRACKER_SHEET_ID"].filter((n) => !process.env[n]?.trim());
    if (missing.length) throw new Error(`Missing settings: ${missing.join(", ")}.`);
    auth = new google.auth.OAuth2(required("GOOGLE_CLIENT_ID"), required("GOOGLE_CLIENT_SECRET"));
    auth.setCredentials({ refresh_token: required("GOOGLE_REFRESH_TOKEN") });
  }
  return auth;
}

export const sheetsApi = () => google.sheets({ version: "v4", auth: getAuth() });
export const driveApi = () => google.drive({ version: "v3", auth: getAuth() });
export const calendarApi = () => google.calendar({ version: "v3", auth: getAuth() });
export const gmailApi = () => google.gmail({ version: "v1", auth: getAuth() });

export const trackerSheetId = () => required("TRACKER_SHEET_ID");
export const driveRootId = () => required("DRIVE_ROOT_ID");
export const appUrl = () => process.env.APP_URL || "http://localhost:3000";

export const driveFolderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;
export const driveFileUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`;
export const gmailDraftUrl = (messageId: string) => `https://mail.google.com/mail/u/0/#drafts?compose=${messageId}`;
export const gmailSearchUrl = (query: string) => `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`;
