# What Kim's settings cover

Kim's actual values live in her tracker's **Settings** tab, one row each (`key`, `value`, `note`), because the files inside an uploaded skill can't be edited. This file lists what's needed and the defaults. When a value is missing from the Settings tab, ask Kim and save her answer there. Suggested keys are in `code`.

## Business
- Business name: Gladden Closings
- Coordinator: Kim Gladden
- Business email: team@gladdenclosings.com
- Phone: `phone`
- Email sign-off (how Kim signs her emails), `signoff`. Default:

  ```
  Thank you!
  Kim Gladden
  Gladden Closings
  [phone]
  ```

- Time zone: America/New_York

## Google
- Drive folder for transaction files, `drive_root_id` (its ID is in the address bar after `/folders/`)
- Tracker Sheet: the one Claude found at the start of the session
- Gmail labels: one per property under `Deals/` (for example `Deals/123 Main St`), and `Deals/Closed/` once a file settles or terminates. Kim can change the parent name with `gmail_label_root`.

## Agents Kim coordinates for
One row each: `agent_1`, `agent_2` … value `Name <email>, Brokerage, buyers/sellers/both`.

| Agent | Email | Brokerage | Buyers, sellers or both | Copy on every email? |
|---|---|---|---|---|
| (example) Jane Smith | jane@brokerage.com | Brokerage Name | Buyers | Yes |

## Title companies
One row each: `title_1`, `title_2` … value `Company; order email; closer name <email>; main office phone; notes`.

| Company | Order email | Closer / clerk | Closer email | Main office phone | Notes |
|---|---|---|---|---|---|
| (example) Title Co | orders@titleco.com | Pat Lee | pat@titleco.com | 215-555-0100 | e.g. "No cashier's checks over $25,000" |

## Team
One row each: `team_member_1` … value `Name <email>`. People Kim may switch on for a file (copied on its day-one emails and, with Kim's OK, invited to its deadlines):

| Name | Email | Role |
|---|---|---|
| (example) Alex Doe | alex@gladdenclosings.com | Assistant |

## SkySlope
- Does Kim upload files to SkySlope for compliance? `uses_skyslope` (yes / no)
- Automatic SkySlope sending: OFF. While off, Claude drafts each SkySlope copy for Kim to send. Each file's SkySlope address comes from the EMAIL field on that file's SkySlope page; Claude never guesses one.

## Kim's own rules
Rows `rule_1`, `rule_2` … for anything Claude should always or never do, for example "never email the seller directly" or "always copy the agent's assistant".
