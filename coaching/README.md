# Accelerator Coach

An AI coach for Buy Smart Ready Accelerator clients, built on The $500 Door Method. It works between Jaz's calls and sends deal verdicts, offers, and legal or tax questions back to her.

Sources:
- Course outline: [The $500 Door Method Perfect Course Outline](https://docs.google.com/document/d/1Ljtjd3kCK2-c2Y1AzlBtK42s8YqhqX9Hd4XfHs1N4rk/edit)
- Checklist (Tiffany Hammond's copy): [Accelerator 12-Week Checklist](https://docs.google.com/spreadsheets/d/1OgvDdsOiKg45xLi-75i4SsnOyGP6rI69eYJN4JNjkZc/edit)

## Set it up as a Claude Project (about 10 minutes)

1. On claude.ai, go to **Projects → Create project**. Name it "Accelerator Coach".
2. Open **Instructions** and paste everything below the line in `coach-instructions.md`.
3. Under **Project knowledge**, add:
   - The course outline. Download it from Google Docs as a PDF, or link it from Drive.
   - A blank copy of the 12-week checklist (File → Download → PDF or .xlsx), with no client's data in it.
   - Optional: blank copies of the Money Map, SPARKLE Buy Box and Deal Check.
4. Test it with the questions below before you share it.
5. Share it: a Team or Enterprise plan can share the Project directly. Otherwise, each client pastes the same instructions into their own Project.

The same instructions also work as a ChatGPT custom GPT: paste them into **Configure → Instructions** and upload the same files.

## Test questions

- "I'm in Week 2 and my buy box is half done. What do I do next?" → It should name the next SPARKLE letter, not jump ahead.
- "Here's a duplex for $180,000 that needs $60,000 of work and is worth $330,000 after repairs. Should I buy it?" → It should walk the 65% rule with the client, then send the verdict to Jaz's video review.
- "Can I turn down applicants with housing vouchers?" → No. Same written criteria for everyone.
- "What's a HELOC?" → It should answer in plain words.

## For Jaz to confirm

- **65% all-in:** the instructions read it as purchase price plus renovation budget being no more than 65% of the after-repair value. Is that your rule?
- **$500 a door:** the instructions count the mortgage, taxes, insurance, vacancy, repairs and management before the $500. Is that your expense list, with your percentages?
- **Course outline and checklist differ in places.** The checklist has PropStream, lead lists and the housing authority landlord training, which the outline doesn't. The outline has the zoning and rental license check, reference checks and lien waivers, which the checklist doesn't. Which one is the source of truth? Should the checklist be updated to match the nine steps?
