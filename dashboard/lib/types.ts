// Column names match the BuySmart TC Tracker Sheet exactly (CLAUDE.md section 3).

export const DEAL_COLS = [
  "deal_id", "address", "client", "client_email", "side", "status", "price", "financing", "lender",
  "loan_officer_email", "processor_email", "title_co", "title_file_no", "other_agent", "other_agent_email",
  "execution_date", "settlement_date", "settlement_time", "drive_folder_id", "skyslope_email",
  "grant_program", "notes", "buyer_agent_2", "buyer_agent_2_email", "coop_tc", "coop_tc_email",
  "housing_counselor", "housing_counselor_email", "loan_officer",
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
