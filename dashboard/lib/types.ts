// Column names match the BuySmart TC Tracker Sheet exactly (CLAUDE.md section 3).

export const DEAL_COLS = [
  "deal_id", "address", "client", "client_email", "side", "status", "price", "financing", "lender",
  "loan_officer_email", "processor_email", "title_co", "title_file_no", "other_agent", "other_agent_email",
  "execution_date", "settlement_date", "settlement_time", "drive_folder_id", "skyslope_email",
  "grant_program", "notes", "buyer_agent_2", "buyer_agent_2_email", "coop_tc", "coop_tc_email",
  "housing_counselor", "housing_counselor_email", "loan_officer", "team_on_file",
  "savings_counselor", "savings_counselor_email",
] as const;

export const MILESTONE_COLS = [
  "deal_id", "seq", "step", "due", "date_type", "status", "owner", "note", "calendar_event_id", "source_link",
] as const;

export const DOCUMENT_COLS = [
  "deal_id", "filename", "drive_file_id", "drive_subfolder", "received_from", "received_at",
  "skyslope_sent_at", "gmail_message_id",
] as const;

export const DRAFT_COLS = [
  "deal_id", "to", "subject", "gmail_draft_id", "reason", "created_at", "status", "gmail_message_id",
] as const;

export const CONTACT_COLS = ["name", "role", "company", "email", "phone", "notes"] as const;

export const ACTIVITY_COLS = ["at", "deal_id", "event", "detail", "source_link", "by"] as const;

type Row<C extends readonly string[]> = Record<C[number], string>;

export type Deal = Row<typeof DEAL_COLS>;
export type Milestone = Row<typeof MILESTONE_COLS>;
export type DocumentRow = Row<typeof DOCUMENT_COLS>;
export type Draft = Row<typeof DRAFT_COLS>;
export type Contact = Row<typeof CONTACT_COLS>;
export type Activity = Row<typeof ACTIVITY_COLS>;

export interface Tracker {
  deals: Deal[];
  milestones: Milestone[];
  documents: DocumentRow[];
  drafts: Draft[];
  contacts: Contact[];
  activity: Activity[];
  settings: Record<string, string>;
}

export const SUBFOLDERS = [
  "1 Contract & Addenda",
  "2 Inspections",
  "3 Lender",
  "4 Title",
  "5 Closing",
  "6 Compliance",
] as const;

/**
 * Work only the server can do: moving PDFs of any size out of Gmail. Claude's jobs add a row; the dashboard's
 * cron (every 5 minutes) does it and writes back status and result. draft: a Gmail draft with the PDF attached
 * (never sent). file: the PDF saved to the deal's Drive subfolder, listed in Documents and copied to SkySlope.
 * skyslope: a SkySlope copy of a document filed before the deal's SkySlope address was confirmed.
 */
export const QUEUE_COLS = [
  "id", "created_at", "deal_id", "action", "gmail_message_id", "attachment", "to", "cc", "subject", "body",
  "drive_subfolder", "filename", "reason", "status", "result", "done_at",
] as const;
export type QueueRow = Row<typeof QUEUE_COLS>;
