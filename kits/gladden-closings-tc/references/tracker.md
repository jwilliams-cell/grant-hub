# The tracker Sheet

One Google Sheet is the database. Kim can read and fix it by hand, so keep it tidy: one row per thing, the exact column order below, dates as YYYY-MM-DD, timestamps as `YYYY-MM-DD HH:MM` Eastern.

## Deals — one row per file
`deal_id` (short slug, e.g. `123-main`) · `address` · `client` · `client_email` · `side` (Buyer | Listing | Dual | Refinance | Hard money) · `status` (Active | Closed | Terminated) · `price` · `financing` · `lender` · `loan_officer_email` · `processor_email` · `title_co` · `title_file_no` · `other_agent` · `other_agent_email` · `execution_date` · `settlement_date` · `settlement_time` · `drive_folder_id` · `skyslope_email` · `grant_program` · `notes` · `buyer_agent_2` · `buyer_agent_2_email` · `coop_tc` · `coop_tc_email` · `housing_counselor` · `housing_counselor_email` · `loan_officer` · `team_on_file` · `savings_counselor` · `savings_counselor_email`

Put the agent Kim coordinates for in `notes` as `Agent: Name <email>` until the Sheet has its own column for it. `skyslope_email` stays `Confirm` until Kim gives the address.

## Milestones — one row per deadline or step
`deal_id` · `seq` · `step` · `due` · `date_type` (Contract | Target | Actual | Unknown) · `status` (To do | Waiting | Done | Late | Flagged) · `owner` · `note` · `calendar_event_id` · `source_link`

`Contract` dates come from the Agreement of Sale; quote the paragraph in `note`. `Target` dates are working dates Claude sets (for example, a week before settlement for insurance). Store the calendar event ID so a moved date moves the event instead of making a second one.

## Documents
`deal_id` · `filename` · `drive_file_id` · `drive_subfolder` · `received_from` · `received_at` · `skyslope_sent_at` · `gmail_message_id`

## Drafts
`deal_id` · `to` · `subject` · `gmail_draft_id` · `reason` · `created_at` · `status` (Waiting for Kim | Sent | Discarded) · `gmail_message_id`

## Contacts
`name` · `role` · `company` · `email` · `phone` · `notes` — add every new person at intake.

## Activity — append only
`at` · `deal_id` · `event` · `detail` · `source_link` · `by` (Claude | Kim)

## Settings
`key` · `value` · `note`. Keys: `last_run_at` (the inbound email job searches Gmail from here), `AUTO_SEND_SKYSLOPE` (FALSE unless Kim turns it on), `drive_root_id`, `timezone`, `settlement_time_default`, `team_member_1` … (`Name <email>`).

## Drive folders
One folder per file inside Kim's transactions folder, named `[Address] – [Client last name]`, with six subfolders:

| Subfolder | What goes in it |
|---|---|
| 1 Contract & Addenda | Agreement of Sale, addenda, change to agreement, seller's response to inspection |
| 2 Inspections | Inspection reports, wood-destroying insect report |
| 3 Lender | Pre-approval, mortgage commitment, appraisal, insurance binder |
| 4 Title | Title commitment, escrow receipt, settlement notice, payoffs, use and occupancy certificate |
| 5 Closing | Closing disclosure, settlement statement, final signed documents |
| 6 Compliance | Consumer notice, buyer agency or listing contract, disclosures, brokerage checklist |
