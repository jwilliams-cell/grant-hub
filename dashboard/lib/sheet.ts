import "server-only";
import { sheetsApi, trackerSheetId } from "./google";
import type { Tracker } from "./types";

const TABS = ["Deals", "Milestones", "Documents", "Drafts", "Contacts", "Activity", "Settings"] as const;
type Tab = (typeof TABS)[number];

function toObjects(values: string[][] | undefined): Record<string, string>[] {
  if (!values?.length) return [];
  const [header, ...rows] = values;
  return rows
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => Object.fromEntries(header.map((key, i) => [key, row[i] ?? ""])));
}

/** Local development without Google: TRACKER_FIXTURE points at a JSON file of { Tab: rows[][] }. */
async function readFixture(file: string): Promise<Record<Tab, string[][] | undefined>> {
  const { readFile } = await import("node:fs/promises");
  const data = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown[][]>;
  return Object.fromEntries(
    TABS.map((tab) => [tab, data[tab]?.map((row) => row.map((v) => String(v ?? "").replace(/^'/, "")))]),
  ) as Record<Tab, string[][] | undefined>;
}

/** Reads every tab in one call. Values come back as the Sheet displays them (dates as YYYY-MM-DD). */
export async function readTracker(): Promise<Tracker> {
  let raw: Record<Tab, string[][] | undefined>;
  if (process.env.TRACKER_FIXTURE) {
    raw = await readFixture(process.env.TRACKER_FIXTURE);
  } else {
    const res = await sheetsApi().spreadsheets.values.batchGet({
      spreadsheetId: trackerSheetId(),
      ranges: TABS.map((t) => `${t}!A:Z`),
      valueRenderOption: "FORMATTED_VALUE",
    });
    raw = Object.fromEntries(TABS.map((tab, i) => [tab, res.data.valueRanges?.[i]?.values as string[][] | undefined])) as Record<Tab, string[][] | undefined>;
  }
  const byTab = Object.fromEntries(TABS.map((tab) => [tab, toObjects(raw[tab])])) as Record<Tab, Record<string, string>[]>;

  return {
    deals: byTab.Deals as Tracker["deals"],
    milestones: byTab.Milestones as Tracker["milestones"],
    documents: byTab.Documents as Tracker["documents"],
    drafts: byTab.Drafts as Tracker["drafts"],
    contacts: byTab.Contacts as Tracker["contacts"],
    activity: byTab.Activity as Tracker["activity"],
    settings: Object.fromEntries(byTab.Settings.map((r) => [r.key, r.value])),
  };
}

/** Sheets parses input like the UI; a leading apostrophe keeps IDs and file numbers as text. */
function cell(value: string | number | boolean | null | undefined): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return value;
  if (/^[0-9][0-9A-Za-z_-]{15,}$/.test(value) || /^[=+]/.test(value)) return `'${value}`;
  return value;
}

/** Appends rows to a tab, in that tab's column order. */
export async function appendRows<C extends readonly string[]>(
  tab: Tab,
  cols: C,
  rows: Partial<Record<C[number], string | number | boolean | null>>[],
): Promise<void> {
  if (!rows.length) return;
  await sheetsApi().spreadsheets.values.append({
    spreadsheetId: trackerSheetId(),
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows.map((row) => cols.map((c) => cell(row[c as C[number]]))) },
  });
}
