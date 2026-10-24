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

**Google:** sign in as jwilliams@gremom.com.
1. In Google Cloud Console, enable the Sheets, Drive, Calendar and Gmail APIs.
2. Create an OAuth client of type *Desktop app*.
3. Put its ID and secret in `.env`.
4. Run `GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… npm run google-auth`, sign in, and paste the printed `GOOGLE_REFRESH_TOKEN` into `.env`.

The scopes are Sheets, Drive, Calendar events and Gmail compose (drafts only). The app can't read Jaz's inbox.

**Hosting:** set `DASHBOARD_PASSWORD` (basic auth) and `APP_URL` before putting it anywhere other than localhost.

**Without Google:** `TRACKER_FIXTURE=/path/to/rows.json npm run dev` reads `{ "Deals": [[header…], [row…]], … }` instead of the Sheet. `../seed/sheet-rows.json` works. New contract still needs Google.

## Checks

```bash
npm test            # date math, contract to plan, email drafts, MIME, dashboard stats
npm run typecheck
npm run build
```
