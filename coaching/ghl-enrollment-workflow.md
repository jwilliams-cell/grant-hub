# GoHighLevel workflow: Accelerator enrollment

Every client who enrolls drops into this workflow automatically. Build it in **Automation → Workflows → Create workflow → Start from scratch** in the Green Mom Consulting sub-account. Name it `Accelerator – Enrollment & Week 1`.

(The workflow API isn't enabled for this sub-account, so Claude can't build it directly. Build it by hand from this sheet once. After that, every enrollment runs on its own.)

## What's automatic and what isn't

| Automatic (GoHighLevel sends it) | Stays personal (GoHighLevel makes Jaz a task) |
|---|---|
| Welcome email and text | Kickoff call recap, written from her call notes |
| Reminders to book the kickoff and send the intake packet | Accountant and Fulton Bank introductions |
| Mission statement → brand kit task for the website team | Deal reviews and anything about money |
| Monday "this week" emails for 12 weeks | |
| Midpoint and graduation booking reminders | |

These emails go out on their own. That's different from the transaction files, where everything is a draft. Keep anything client-specific as a task for Jaz.

## Set up first (one time)

1. **Tags:** `accelerator`, `accel-intake-received`, `accel-mission-received`, `accel-kickoff-done`
2. **Pipeline** `Accelerator` with stages: Enrolled → Kickoff booked → Intake received → Kickoff done → Brand kit → Website live → Week 1 … Week 12 → Under contract → Closed → Graduated
3. **Calendars:** `Accelerator Kickoff`, `Accelerator Midpoint`, `Accelerator Graduation`, `Accelerator 1:1` (the extra-call link already exists)
4. **Forms:**
   - `Accelerator Intake`, with file uploads: bank statements, tax returns, W-2s or 1099s, pay stub, driver's license, company documents, plus a Loom link for the Money Map. On submit, add the tag `accel-intake-received`.
   - `Mission Statement`, optional. The [Mission Statement Guide](https://claude.ai/artifact/NPPXHcW7dtNYLBkMyBUFY9) ends with **Send to Jaz**, which opens an email to jwilliams@gremom.com with every answer filled in (or the client copies them into a reply). When it arrives, add the tag `accel-mission-received` to start the brand kit. A one-box form that takes the pasted answers can add the tag on its own instead.
5. **Custom values:** `accel_slack_link`, `accel_money_map_link`, `accel_intake_form_link`, `accel_mission_guide_link` (https://claude.ai/artifact/NPPXHcW7dtNYLBkMyBUFY9), `accel_mission_form_link`, `accel_kickoff_link`, `accel_midpoint_link`, `accel_graduation_link`, `accel_office_hours_link`

## The workflow

**Trigger:** *Order Submitted* (or *Payment Received*) → filter: product is the Accelerator.
Add a second trigger, *Contact Tag Added* = `accelerator`, so Jaz can enroll someone by hand.

| # | Action | Details |
|---|---|---|
| 1 | Add tag | `accelerator` |
| 2 | Create/update opportunity | Pipeline `Accelerator`, stage **Enrolled** |
| 3 | Send 3 emails, a few minutes apart | **Pre-approval list + document folder** (shares the folder), then **Mission statement** (the guide link), then **Your 12-week checklist**. One job per email, so each one gets done. Wording: the drafts made for Selya Rollins on Oct 29, 2026 |
| 4 | Send SMS | "Welcome to the Accelerator, {{contact.first_name}}! Check your email for your next steps, and book your kickoff here: {{custom_values.accel_kickoff_link}} – Jasmine" |
| 5 | Internal notification + task for Jaz/Kenya | "New Accelerator client: {{contact.name}}. Make their copy of the 12-week checklist, add them to Slack and the coach." Due in 1 day |
| 6 | Wait for event | Appointment booked on `Accelerator Kickoff`. **Timeout 2 days** |
| 6a | → If timed out | Send SMS: "Quick nudge to book your kickoff call: {{custom_values.accel_kickoff_link}}". Wait 2 days; if still not booked, task for Jaz: "Call {{contact.name}}: kickoff not booked" |
| 7 | Update opportunity | Stage **Kickoff booked** |
| 8 | Wait | Until **2 days before** the appointment |
| 9 | If/else | Has tag `accel-intake-received`? |
| 9a | → No | Send email **Intake reminder** (below). Wait until 1 day before; if still no tag, task for Jaz: "Intake not in. Remind or reschedule?" |
| 9b | → Yes | Update opportunity → **Intake received** |
| 10 | Wait for event | Appointment status = **Showed** |
| 11 | Add tag + update opportunity | `accel-kickoff-done`, stage **Kickoff done** |
| 12 | Task for Jaz | "Send {{contact.first_name}}'s kickoff recap (Notes from today + your next steps). Accountant intro, Fulton Bank intro." Due in 2 days |
| 13 | Add to workflow | `Accelerator – Weekly` (below) |

**Separate small workflow:** `Accelerator – Brand kit`. The trigger is the tag `accel-mission-received` being added.

1. Update the opportunity to **Brand kit**.
2. Create a task for the website team: "Build {{contact.name}}'s brand kit from their mission statement, then send it for approval." Due in 5 days.
3. Wait 10 days, then create a task: "Website for {{contact.name}}: approved and building?"

## `Accelerator – Weekly` workflow

Add one Monday email per week. Each one says what's unlocking that week, links the checklist, and reminds them about office hours. Use *Wait until Monday 8:00 am*, then send, then repeat for each week.

| Week | Subject | Extra |
|---|---|---|
| 1 | Week 1: your foundation | Company, bank account, mission statement |
| 2 | Week 2: your SPARKLE Buy Box | Financial snapshot, accountant |
| 3 | Week 3: your first deal analyses | Submit 3 for video review |
| 4 | Week 4: your search tools | |
| 5 | Week 5: your money plan | Pre-approval needs list; cash plan includes reserves |
| 6 | Week 6: your team, and your midpoint call | Booking link: {{custom_values.accel_midpoint_link}} |
| 7–9 | Deal hunting | Repeat until under contract |
| 10 | Week 10: your offer | Set your walk-away price first |
| 11 | Week 11: inspection and contractor | Insurance binder at contract |
| 12 | Week 12: closing and graduation | Booking link: {{custom_values.accel_graduation_link}} |

Stop condition: the opportunity moves to **Under contract**. That client then moves to the transaction coordinator system.

## Emails

Enrollment sends three separate emails (step 3): the pre-approval list with the document folder, the mission statement request, and the checklist. The Welcome email below is the short version for clients who need less.

### Welcome

> **Subject:** Welcome to the Accelerator! Your next steps
>
> Hi {{contact.first_name}},
>
> I'm so excited to have you in! Over the next 12 weeks we're getting you to your first rental, one that pays you at least $500 a unit every month.
>
> Here's what to do this week:
>
> 1. **Book your kickoff call:** {{custom_values.accel_kickoff_link}}
> 2. **Join our Slack** for check-ins: {{custom_values.accel_slack_link}}
> 3. **Fill in your Money Map** and record a quick Loom walking me through it: {{custom_values.accel_money_map_link}}
> 4. **Send your documents** at least 2 days before your kickoff: {{custom_values.accel_intake_form_link}}
> 5. **Write your mission statement** with my guide: {{custom_values.accel_mission_guide_link}}. When you're done, click **Copy my mission** and paste it here: {{custom_values.accel_mission_form_link}}. We use it to build your brand kit and your website.
>
> Documents: your last 3 months of bank statements, your last 2 years of tax returns and W-2s or 1099s, your most recent pay stub, your driver's license, and your company documents if you already have a company.
>
> Don't have everything? That's OK. Gather what you have and we'll fill in the blanks on our call. Please upload scans, not phone photos.
>
> You must put in the work to get the results, and I'll be with you every step.
>
> Jasmine

### Intake reminder

> **Subject:** Your kickoff is in 2 days
>
> Hi {{contact.first_name}},
>
> Our kickoff call is coming up on {{appointment.start_time}}. Please send your Money Map and documents before then so we can hit the ground running: {{custom_values.accel_intake_form_link}}
>
> Missing something? Send what you have. We'll fill in the blanks together.
>
> Jasmine
