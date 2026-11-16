# Workflows

Contents: 1 New file · 2 Inbound email · 3 Deadline sweep and morning summary · 4 After closing · 5 Termination

---

## 1. New file (intake)

**Starts when** Kim uploads or forwards a signed Agreement of Sale, an email says "under contract", "fully executed" or "ratified" for a property not yet in the tracker, or Kim says a client is under contract.

### Step 1 — Read the whole contract and every addendum

Work only from what the documents say. Never invent a person, email, phone number or date, and never fill in a Pennsylvania form default when the contract states its own number.

**Property and money:** address with ZIP, price, deposit amount, additional deposit, seller assist or credits (with amounts and the paragraph), items included or excluded, financing type (conventional, Federal Housing Administration, Veterans Affairs, cash, hard money, refinance), loan amount.

**People** (name, email, phone for each): buyers and sellers, plus the company name and signer if one is an LLC; both agents and their brokerages; a second agent on either side; the other side's transaction coordinator if named; lender (loan officer, processor); title company and file number; housing or grant counselor if there's an assistance program. Also: **which of Kim's agents this file is for.**

**Dates.** The execution date is the last signature or initial. When the contract gives a number of days, count the calendar date from the execution date and say so. Quote the paragraph for each date. On the standard Pennsylvania Association of Realtors Agreement of Sale, when a blank is left empty the form's default applies; say "blank, so the form default of N days" in the note:

| Deadline | Where it usually is | Form default when blank |
|---|---|---|
| Initial deposit | Paragraph 2 | 5 days after execution |
| Additional deposit | Paragraph 2 | as written |
| Mortgage application | Paragraph 8 | 7 days after execution |
| Buyer to lock the interest rate | Paragraph 8 | as written (often 15 days before settlement) |
| Mortgage commitment date | Paragraph 8 | as written |
| Loan conditions satisfied after commitment | Paragraph 8 | 7 days after the commitment date |
| Inspection contingency (reply to inspection due) | Paragraph 13 | 10 days after execution |
| Repair negotiation period | Paragraph 13 | 5 days after the contingency ends |
| Buyer accepts or terminates if no repair agreement | Paragraph 13 | 2 days after the negotiation period |
| Buyer orders title | Paragraph 14 | 7 days after execution |
| Seller orders municipal use and occupancy certificate | Paragraph 15 | 30 days after execution, and at least 15 days before settlement |
| Homeowner association resale documents requested | Paragraph 16 | 15 days after execution |
| Settlement | Paragraph 4 | as written |

Paragraph numbers can move between form versions, so check them against the document. Anything you couldn't confirm gets **Confirm** instead of a date.

### Step 2 — Show Kim and wait

Show one table of dates (date, what's due, paragraph) and one of people. Mark anything unconfirmed. Ask the open questions in plain words, for example: "Which agent is this file for?", "Cash or financing?", "Is there a down payment assistance program?", "Who from your team should be on this file?", "What's this file's SkySlope email?" Wait for Kim's OK before Step 3.

### Step 3 — Build the file

1. **Drive:** create `[Address] – [Client last name]` in Kim's transactions folder, with the six subfolders (`references/tracker.md`). Save the contract to `1 Contract & Addenda` as `[Address] – [Client last name] – Agreement of Sale – [execution date].pdf`.
2. **Calendar:** one all-day event per dated deadline on Kim's calendar, titled `[Address] – [Deadline]`, shown as free (not busy), with reminders two days before and the morning before. The description holds the client, the agent, and the Drive folder link. Invite only the people Kim named for this file.
3. **Tracker:** add the Deals row, one Milestones row per deadline (with the calendar event ID), the contract in Documents, new people in Contacts, and an Activity row.
4. **Gmail:** create the label `Deals/[Address]` and put the contract email in it.
5. **SkySlope:** if the file has a SkySlope email, draft the contract copy to it (subject = the file name, empty body), unless automatic sending is on.

### Step 4 — Day-one drafts

Draft from `references/templates.md`, copying the agent on this file and any team member Kim switched on:

- Buyer side: title order · deposit instructions request to the title clerk · lender introduction (financed only) · key dates to the other agent (copy their coordinator) · welcome email to the buyer · company documents request if the buyer is an LLC · housing counselor check-in if there's an assistance program.
- Listing side: key dates to the buyer's agent · welcome email to the seller · seller's title documents request (payoff, water and sewer, homeowner association).

Then report back: what was built, the drafts waiting, and the open questions.

---

## 2. Inbound email

**Starts when** Kim asks you to go through new email, or on a scheduled run.

1. **Find:** search Gmail from the Settings tab's `last_run_at` (or the last 3 days) for anything about an active file. Match on the street address (with or without St, Ave), the title file number, the client's last name, or any email address on the file. Skip automated marketing (listing alerts, showing services, newsletters).
2. **Label:** add the file's `Deals/[Address]` label to each matching thread. Never archive, mark read or delete anything.
3. **Read and act:**

| The email says | Do this |
|---|---|
| Escrow receipt or "deposit received" | Deposit → Done; file the receipt in `4 Title` |
| Inspection report | Inspection → Done; file in `2 Inspections`; remind Kim of the reply deadline |
| Inspection reply or seller's response to it | **Flag for Kim** — negotiations are hers and the agent's. File the signed document in `1 Contract & Addenda` once it's signed |
| A form to sign (lead paint, wood-destroying insect report, disclosures) | Draft a request to the client to sign; milestone → Waiting |
| Application complete, appraisal ordered or scheduled | Update the milestone; note the appraisal date |
| Appraisal result | Appraisal → Done; note the value. **Below the price, or repairs required → flag at the top** |
| Title commitment | Title commitment → Done; file in `4 Title`; add each requirement title lists as its own milestone with who owes it |
| Mortgage commitment | Commitment → Done; file in `3 Lender`; add each underwriter condition as a milestone; **on buyer files, draft the commitment to the listing agent with only the commitment letter attached**, never the lender's email or conditions (they show the buyer's personal finances) |
| Clear to close | Clear to close → Done; draft the request to title to schedule settlement |
| Settlement notice (date, time, place) | Update the Deals row; draft the settlement details email to the client. If the date changed, **flag it and ask Kim** before moving any calendar event |
| Extension, change to agreement, new date | **Flag; ask Kim** before changing anything. Once she confirms, move the existing events (never make a second one) |
| Termination or release | **Flag; change nothing** until Kim confirms. Then Workflow 5 |
| Closing documents, settlement statement | Closing → Done; file in `5 Closing`; start Workflow 4 |
| SkySlope notice (signed, checklist item flagged or rejected) | Add a Compliance milestone with what the broker needs |
| Anything else that needs an answer | Draft a reply for Kim |
| "Received" or "thanks" | Note it; nothing else |

4. **File attachments** with the naming rule and draft each SkySlope copy (`SKILL.md`, "How to work").
5. **Log** each change in Activity with the email link, update `last_run_at`, and report.

---

## 3. Deadline sweep and morning summary

For each active file:

1. **Due within 2 days and not done:** draft the follow-up from `references/templates.md` ("Follow-ups").
2. **Past due:** mark the milestone Late and put it first in the summary.
3. **Asked for something 2 business days ago with no answer:** draft a polite nudge.
4. **Three business days before settlement:** draft the closing disclosure reminder to the lender.
5. **Insurance:** a week before settlement with no binder on file, draft a reminder to the buyer.

**Morning summary** to Kim only, under 250 words: late items, due today and tomorrow, drafts waiting (recipient and subject), and decisions only she can make. Send it to Kim's own email address — the one email that may go out without a draft, because it goes only to Kim — or show it in chat if she's asking in person.

---

## 4. After closing

1. File the final signed documents and settlement statement in `5 Closing`.
2. Check `6 Compliance`: consumer notice, buyer agency or listing contract, seller's property disclosure, lead paint disclosure for homes built before 1978, final settlement statement, anything the brokerage's checklist asks for. List what's missing for Kim; commission often waits on it.
3. Set the file to Closed and rename its Gmail label to `Deals/Closed/[Address]`.
4. Draft a congratulations note to the client.

---

## 5. Termination (only after Kim confirms)

1. Set the file to Terminated; log who confirmed it and when.
2. Ask Kim before removing the file's future calendar events, since anyone invited will see them disappear. When she says yes, delete them without sending cancellation emails.
3. Offer drafts: cancel the title order, withdraw the loan file, release of deposit paperwork to both agents, and the signed termination and release to SkySlope.
4. Rename the Gmail label to `Deals/Closed/[Address]`.
