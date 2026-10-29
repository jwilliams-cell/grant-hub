# BuySmart Transaction Desk (dashboard)

A Next.js app that reads the **BuySmart TC Tracker** Google Sheet and shows every file, following `../DESIGN.md`. It has one write path: **New contract**.

## New contract: from Agreement of Sale to a working file

1. Drop the fully signed Agreement of Sale (PDF, with every addendum) on **New contract**.
2. Claude (`claude-opus-5-5`) reads it and pulls out the property, money, people and every deadline. When a deadline is "X days after execution", the app counts the date out. Anything Claude couldn't confirm is shown in amber.
3. Jaz checks and corrects the dates and contacts. The page lists exactly what will be created. **Nothing is created until she clicks Confirm.**
4. On confirm, the app:
   - creates `02 — Clients / Transactions / [Address] – [Last name]` with subfolders 1 to 6, and saves the contract to `1 Contract & Addenda` as `[Address] – Agreement of Sale – [execution date].pdf`
   - adds the milestones to the Sheet, and adds each dated deadline to Jaz's primary calendar as an all-day event. Events have no attendees, so no invites go out.
   - creates the day-one emails as **Gmail drafts** (title order, lender introduction, key dates to the listing agent, buyer congratulations with the wire-fraud line). It also drafts the LLC document request when the buyer is a company, and a grant-package reminder to Jaz when the file has a grant.
   - writes the deal, documents, drafts and activity rows to the Sheet

Nothing is ever sent. Settlement date changes, terminations and inspection negotiations stay with Jaz.

Limits:
- Google Calendar can't remind after an all-day event starts. Reminders are set for 9am two days before and 9am the day before, instead of "the morning of".
- Listing-side files get only the key dates email. The seller-side conveyancing email still has to be written by hand.
- SkySlope copies wait until Jaz confirms each file's SkySlope address (phase 5).

## Setup

```bash
cd dashboard
npm install
cp .env.example .env    # then fill it in
npm run dev             # http://localhost:3000
```

**Anthropic:** set `ANTHROPIC_API_KEY`.

**Google:** sign in as jwilliams@gremom.com. The live setup uses the Google Cloud project `BuySmart Desk`.
1. In Google Cloud Console, enable the Sheets, Drive, Calendar and Gmail APIs. On the consent screen, choose Internal if offered. Otherwise choose External and **publish** the app, or the refresh token expires after 7 days.
2. Create an OAuth client of type *Web application* with redirect URI `https://developers.google.com/oauthplayground`.
3. In the OAuth Playground, open the gear icon and tick **Use your own OAuth credentials** with that client's ID and secret. Authorize the five scopes below, then exchange the code for a refresh token. Without the tick, the token belongs to the Playground's own client and Google returns `unauthorized_client`.
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REFRESH_TOKEN`.

(Alternative for a local setup: a *Desktop app* client plus `npm run google-auth`.)

Error guide: `invalid_client` means the ID and secret don't match. `unauthorized_client` means the refresh token came from a different client. `invalid_grant` means the refresh token expired or was revoked, so get a new one.

The scopes are:

```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/gmail.readonly
```

Gmail compose makes drafts. Gmail read only lets the server read a lender or title email and copy its PDF into a draft, Drive or SkySlope, since large PDFs can't pass through the Claude connectors. It can't delete, archive or change any email.

**Hosting (Vercel):** import the repo with Root Directory `dashboard`, and set the variables from `.env.example` in the project settings. Always set `DASHBOARD_PASSWORD` (basic auth) and `APP_URL`. Then create a **private Blob store** under Storage and connect it to the project. That adds `BLOB_STORE_ID` (or, on older stores, `BLOB_READ_WRITE_TOKEN`), so contracts upload straight to Blob storage, past Vercel's 4.5 MB request limit. Each contract is deleted from Blob storage once it's saved in Drive. `npm run build` copies `../transaction-coordinator.md` into `content/` for the Playbook page.

**GoHighLevel (optional):** set `GHL_API_TOKEN`, a Private Integration token with only **View Contacts** (`contacts.readonly`), and `GHL_LOCATION_ID` (`gNdke52cCmciGCskwhzq`, Green Mom Consulting LLC). That adds **Find in GoHighLevel** next to each buyer on the review screen and in Edit people. It searches by first name, ranks contacts with a matching or partial last name and the "home buyer client" tag first, and fills email and phone only when Jaz clicks Use. It never writes to GoHighLevel.

**Edit people:** each file page has an Edit people form that updates that file's Deals row (looked up by `deal_id`) and logs the change in Activity.

**Without Google:** `TRACKER_FIXTURE=/path/to/rows.json npm run dev` reads `{ "Deals": [[header…], [row…]], … }` instead of the Sheet. `../seed/sheet-rows.json` works. New contract still needs Google.

## Checks

```bash
npm test            # date math, contract to plan, email drafts, MIME, dashboard stats
npm run typecheck
npm run build
```

**Queue worker:** `vercel.json` runs `/api/cron/queue` every 5 minutes. It works through the tracker's `Queue` tab (see `lib/queue.ts`): drafts that carry a PDF from Gmail, and PDFs filed to Drive and copied to SkySlope. Optionally set `CRON_SECRET` in Vercel; Vercel then sends it with each cron call and the route refuses anything else. The route skips the dashboard password.

## Accelerator enrollment

`POST /api/accelerator/enroll` is called by the GoHighLevel workflow (see `../coaching/ghl-enrollment-workflow.md`) when a client enrolls. For each new client it:
- creates `02 — Clients / Accelerator / [Name] – Accelerator`, with subfolders 1 Money & Pre-Approval, 2 Company & Bank, 3 Brand & Website, 4 Deal Analyses, 5 Team & Contracts and 6 Closing & Renovation
- copies the blank checklist (`Accelerator 12-Week Checklist – TEMPLATE`) into it, and fills in the client name and the start date (the first Monday)
- shares the folder with the client as an editor. Drive stays silent if it can; for an address with no Google account, Drive sends its own invite
- adds a row to the tracker's `Accelerator` tab and logs it in Activity
- with `GHL_ENROLL_TOKEN` set, writes the links to the contact's `accel_folder_link` and `accel_checklist_link` custom fields so the welcome email can use them

It's safe to call twice: a second call finds the client's row or folder and returns the same links.

Setup: set `ACCELERATOR_DRIVE_ROOT_ID`, `ACCELERATOR_CHECKLIST_TEMPLATE_ID` and `ACCELERATOR_WEBHOOK_SECRET` in Vercel. In GoHighLevel, add a **Webhook** action at the start of the enrollment workflow: method POST, URL `https://grant-hub-dashboard-sgph.vercel.app/api/accelerator/enroll?key=<secret>`. Then add a **Wait** of 1 minute before the welcome email, so the links are on the contact when it sends.
