import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, businessDaysBefore, daysBetween, todayET, minutesSince } from "./dates.ts";
import { dealSlug, resolveDates, type Contract } from "./contract.ts";
import { buildPlan } from "./plan.ts";
import { buildMime } from "./mime.ts";
import { stepper, todayView } from "./view.ts";
import { WIRE_LINE } from "./templates.ts";
import type { Deal, Milestone, Tracker } from "./types.ts";

const blankDate = { date: null, days_after_execution: null, source: null, confirm: true };

function sampleContract(overrides: Partial<Contract> = {}): Contract {
  return {
    property: { address: "5722 Malcolm St", city: "Philadelphia", zip: "19143" },
    side: "Buyer",
    price: 210000,
    deposit_amount: 5000,
    seller_assist: null,
    financing_type: "FHA",
    loan_amount: 202650,
    grant_program: "Affordable Housing Centers of PA",
    items_included_excluded: null,
    buyers: [{ name: "Alexis McIntosh", email: "alexis@example.com", phone: null }],
    sellers: [{ name: "Still Properties LLC", email: null, phone: null }],
    buyer_entity: null,
    seller_entity: { name: "Still Properties LLC", signer: null },
    listing_agent: { name: "Dave Goldsmith", brokerage: "KW Empower", email: "dave@example.com", phone: null },
    buyer_agent: { name: "Jasmine Williams", brokerage: "Realty ONE Group Focus", email: "jwilliams@gremom.com", phone: null },
    buyer_agent_2: null,
    coop_coordinator: null,
    lender: {
      company: "First Citizens Community Bank",
      loan_officer: { name: "Crista Lowrie", email: "clowrie@myfccb.com", phone: null },
      processor: { name: "Carol Mehaffey", email: "camehaffey@myfccb.com", phone: null },
    },
    title: { company: "Quick Abstract", file_no: null },
    grant_counselor: null,
    dates: {
      execution: { date: "2026-10-10", days_after_execution: null, source: "Last signature 10/10/2026", confirm: false },
      deposit_due: { date: null, days_after_execution: 5, source: "Paragraph 2", confirm: false },
      mortgage_application_due: { date: null, days_after_execution: 7, source: "Paragraph 4", confirm: false },
      inspection_contingency_end: { date: null, days_after_execution: 10, source: "Paragraph 12", confirm: false },
      seller_response_end: { ...blankDate },
      appraisal_contingency_end: { ...blankDate },
      mortgage_commitment: { date: "2026-11-03", days_after_execution: null, source: "Paragraph 4(F)", confirm: false },
      settlement: { date: "2026-11-13", days_after_execution: null, source: "Paragraph 5", confirm: false },
    },
    settlement_place: "Quick Abstract",
    inspection_type: "contingency",
    possession: null,
    other_deadlines: [],
    open_questions: [],
    ...overrides,
  };
}

test("date helpers", () => {
  assert.equal(addDays("2026-10-30", 3), "2026-11-02");
  assert.equal(businessDaysBefore("2026-11-13", 3), "2026-11-10"); // Friday -> Tuesday
  assert.equal(businessDaysBefore("2026-11-16", 1), "2026-11-13"); // Monday -> Friday
  assert.equal(daysBetween("2026-10-24", "2026-11-13"), 20);
  assert.equal(todayET(new Date("2026-10-25T02:00:00Z")), "2026-10-24"); // 10pm Eastern
  assert.equal(minutesSince("2026-10-24 15:15", new Date("2026-10-24T19:45:00Z")), 30);
});

test("slugs match the seeded deal ids", () => {
  assert.equal(dealSlug("5722 Malcolm St"), "5722-malcolm");
  assert.equal(dealSlug("125 S 54th St"), "125-s-54th");
  assert.equal(dealSlug("7076 Forrest Ave."), "7076-forrest");
});

test("resolveDates counts days from execution and flags missing dates", () => {
  const c = resolveDates(sampleContract());
  assert.equal(c.dates.deposit_due.date, "2026-10-15");
  assert.equal(c.dates.inspection_contingency_end.date, "2026-10-20");
  assert.equal(c.dates.settlement.date, "2026-11-13");
  assert.equal(c.dates.seller_response_end.date, null);
  assert.equal(c.dates.seller_response_end.confirm, true);
});

test("resolveDates never overwrites a stated date and rejects malformed ones", () => {
  const c = sampleContract();
  c.dates.deposit_due = { date: "2026-10-12", days_after_execution: 5, source: null, confirm: false };
  c.dates.settlement = { date: "11/13/2026", days_after_execution: null, source: null, confirm: false };
  const r = resolveDates(c);
  assert.equal(r.dates.deposit_due.date, "2026-10-12");
  assert.equal(r.dates.settlement.date, null);
  assert.equal(r.dates.settlement.confirm, true);
});

test("buyer plan: four day-one drafts plus grant reminder, wire line, no sends", () => {
  const plan = buildPlan(resolveDates(sampleContract()));
  assert.equal(plan.dealId, "5722-malcolm");
  assert.equal(plan.folderName, "5722 Malcolm St – McIntosh");
  assert.equal(plan.contractFilename, "5722 Malcolm St – Agreement of Sale – 2026-10-10.pdf");
  assert.deepEqual(plan.drafts.map((d) => d.kind), ["title_order", "lender_intro", "agent_timeline", "buyer_congrats", "grant_reminder"]);
  const congrats = plan.drafts.find((d) => d.kind === "buyer_congrats")!;
  assert.ok(congrats.body.includes(WIRE_LINE));
  assert.deepEqual(congrats.cc, ["smartin@quickabstract.com"]);
  for (const d of plan.drafts) {
    assert.ok(!/be honest with me/i.test(d.body));
    // Jaz's own welcome template signs off as Client Care; every other email is signed "Jasmine".
    if (d.kind === "buyer_congrats") assert.ok(d.body.endsWith("Realty ONE Group Focus"));
    else assert.ok(d.body.trimEnd().endsWith("Jasmine") || d.kind === "grant_reminder");
  }
  assert.equal(plan.deal.other_agent, "Dave Goldsmith, KW Empower");
  assert.equal(plan.deal.skyslope_email, "Confirm");
});

test("buyer plan milestones: dates, calendar flags and closing disclosure timing", () => {
  const plan = buildPlan(resolveDates(sampleContract()));
  const by = (s: string) => plan.milestones.find((m) => m.step.startsWith(s))!;
  assert.equal(by("Under contract").status, "Done");
  assert.equal(by("Under contract").calendar, false);
  assert.equal(by("Deposit").due, "2026-10-15");
  assert.equal(by("Reply to inspection").date_type, "Contract");
  assert.equal(by("Seller's response").due, "");
  assert.equal(by("Seller's response").date_type, "Unknown");
  assert.equal(by("Seller's response").calendar, false);
  assert.equal(by("Closing disclosure").due, "2026-11-10");
  assert.equal(by("Grant package").due, "2026-10-14");
  assert.equal(by("Settlement").status, "Scheduled");
  assert.deepEqual(plan.milestones.map((m) => m.seq), plan.milestones.map((_, i) => String(i + 1)));
});

test("cash LLC buyer on Gmail: no lender drafts, LLC request, Gmail warning", () => {
  const plan = buildPlan(resolveDates(sampleContract({
    financing_type: "Cash",
    grant_program: null,
    lender: null,
    buyers: [{ name: "Pat Lee", email: "patlee@gmail.com", phone: null }],
    buyer_entity: { name: "Lee Homes LLC", signer: "Pat Lee" },
  })));
  assert.deepEqual(plan.drafts.map((d) => d.kind), ["title_order", "agent_timeline", "buyer_congrats", "llc_documents"]);
  assert.ok(!plan.milestones.some((m) => /mortgage|apprais|closing disclosure/i.test(m.step)));
  assert.ok(plan.milestones.some((m) => m.step.startsWith("LLC documents") && m.due === "2026-10-17"));
  assert.ok(plan.warnings.some((w) => w.includes("Gmail, Yahoo or AOL")));
  assert.equal(plan.folderName, "5722 Malcolm St – Lee Homes LLC");
});

test("drafts are skipped, with a warning, when an email is missing", () => {
  const plan = buildPlan(resolveDates(sampleContract({ listing_agent: { name: "Dave", brokerage: null, email: null, phone: null } })));
  assert.ok(!plan.drafts.some((d) => d.kind === "agent_timeline"));
  assert.ok(plan.warnings.some((w) => w.includes("key dates email")));
});

test("MIME draft carries the attachment and an encoded subject", () => {
  const raw = buildMime(
    { to: ["a@example.com"], cc: ["b@example.com"], subject: "5722 Malcolm St – Title Order", body: "Hello", attachment: { filename: "x – y.pdf", mimeType: "application/pdf", data: Buffer.from("%PDF-1.4") } },
    "B",
  );
  const text = Buffer.from(raw, "base64url").toString();
  assert.match(text, /^To: a@example.com\r\nCc: b@example.com\r\nSubject: =\?UTF-8\?B\?/);
  assert.ok(text.includes('Content-Type: multipart/mixed; boundary="B"'));
  assert.ok(text.includes(Buffer.from("%PDF-1.4").toString("base64")));
  assert.ok(text.trimEnd().endsWith("--B--"));
});

test("today view and stepper on the Malcolm St seed", () => {
  const deal = { deal_id: "5722-malcolm", address: "5722 Malcolm St", status: "Active", settlement_date: "2026-11-13" } as Deal;
  const m = (seq: number, step: string, due: string, status: string) => ({ deal_id: "5722-malcolm", seq: String(seq), step, due, status } as Milestone);
  const milestones = [
    m(1, "Under contract — lender, grant counselor and title notified", "2026-10-13", "Done"),
    m(5, "Deposit received by title (escrow receipt)", "2026-10-16", "Done"),
    m(7, "Seller's signed response to inspection reply", "", "Waiting"),
    m(8, "Appraisal", "2026-10-19", "Done"),
    m(9, "Title commitment received; fees and commissions sent to title", "2026-10-21", "Done"),
    m(10, "Seller items to title", "2026-11-06", "Waiting"),
    m(12, "Mortgage commitment", "", "Waiting"),
    m(14, "Closing disclosure signed", "2026-10-23", "To do"),
    m(16, "Final walk-through", "2026-10-26", "To do"),
    m(17, "Settlement", "2026-11-13", "Scheduled"),
  ];
  const t = { deals: [deal], milestones, drafts: [], documents: [], contacts: [], activity: [], settings: {} } as Tracker;
  const v = todayView(t, "2026-10-24");
  assert.equal(v.nextSettlement?.days, 20);
  assert.equal(v.waitingOnOthers, 3);
  assert.deepEqual(v.late.map((x) => x.m.seq), ["14"]);
  assert.deepEqual(v.dueSoon.map((x) => x.m.seq), ["16"]);
  const s = Object.fromEntries(stepper(deal, milestones).map((x) => [x.stage, x.state]));
  assert.equal(s.Contract, "done");
  assert.equal(s.Deposit, "done");
  assert.equal(s.Inspection, "current");
  assert.equal(s.Appraisal, "done");
  assert.equal(s.Commitment, "upcoming");
});

test("co-agent, seller side coordinator and SkySlope email reach the right drafts", () => {
  const plan = buildPlan(resolveDates(sampleContract({
    buyer_agent_2: { name: "Kenya Matthews", email: "k.matthews@kw.com", phone: null, brokerage: "Keller Williams" },
    coop_coordinator: { name: "Tara Ruiz", email: "tara@listingtc.com", phone: null },
    skyslope_email: " MalcolmSt5722@skyslope.com ",
  })));
  const by = (k: string) => plan.drafts.find((d) => d.kind === k)!;
  for (const k of ["title_order", "lender_intro", "agent_timeline", "buyer_congrats"]) {
    assert.ok(by(k).cc.includes("k.matthews@kw.com"), `${k} copies the co-agent`);
  }
  assert.ok(by("title_order").body.includes("Co-agent: Kenya Matthews — k.matthews@kw.com"));
  assert.ok(by("agent_timeline").cc.includes("tara@listingtc.com"));
  assert.ok(!by("buyer_congrats").cc.includes("tara@listingtc.com"));
  assert.equal(plan.deal.buyer_agent_2, "Kenya Matthews, Keller Williams");
  assert.equal(plan.deal.coop_tc, "Tara Ruiz");
  assert.equal(plan.deal.coop_tc_email, "tara@listingtc.com");
  assert.equal(plan.deal.skyslope_email, "MalcolmSt5722@skyslope.com");
  assert.ok(!plan.warnings.some((w) => w.includes("SkySlope")));
});

test("a SkySlope email that isn't @skyslope.com is never stored", () => {
  const plan = buildPlan(resolveDates(sampleContract({ skyslope_email: "malcolm@gmail.com" })));
  assert.equal(plan.deal.skyslope_email, "Confirm");
  assert.ok(plan.warnings.some((w) => w.includes("@skyslope.com")));
});

test("dual file: Jaz isn't emailed as her own listing agent", () => {
  const plan = buildPlan(resolveDates(sampleContract({
    side: "Dual",
    listing_agent: { name: "Jasmine Williams", email: "jwilliams@gremom.com", phone: null, brokerage: "Realty ONE Group Focus" },
  })));
  assert.ok(!plan.drafts.some((d) => d.kind === "agent_timeline"));
  for (const d of plan.drafts.filter((d) => d.kind !== "grant_reminder")) {
    assert.ok(![...d.to, ...d.cc].includes("jwilliams@gremom.com"), d.kind);
  }
});

test("SkySlope copy: draft by default, send only when on, never to a bad address", async () => {
  const { skySlopeCopy } = await import("./skyslope.ts");
  const doc = { filename: "5722 Malcolm St – Agreement of Sale – 2026-10-10.pdf", data: Buffer.from("%PDF-1.4") };
  assert.equal(skySlopeCopy("MalcolmSt5722@skyslope.com", {}, doc).mode, "draft");
  assert.equal(skySlopeCopy("MalcolmSt5722@skyslope.com", { AUTO_SEND_SKYSLOPE: "FALSE" }, doc).mode, "draft");
  const sent = skySlopeCopy(" MalcolmSt5722@skyslope.com ", { AUTO_SEND_SKYSLOPE: "TRUE" }, doc);
  assert.equal(sent.mode, "send");
  const text = Buffer.from(sent.raw, "base64url").toString();
  assert.match(text, /^To: MalcolmSt5722@skyslope.com\r\n/);
  assert.ok(!/^(Cc|Bcc):/m.test(text));
  for (const bad of ["Confirm", "", "malcolm@gmail.com", "x@skyslope.com.evil.com", "a@b@skyslope.com"]) {
    assert.equal(skySlopeCopy(bad, { AUTO_SEND_SKYSLOPE: "TRUE" }, doc).mode, "none", bad);
  }
});

test("housing agency email: drafted only for a counselor Jaz enters, in her wording", () => {
  const noCounselor = buildPlan(resolveDates(sampleContract()));
  assert.ok(!noCounselor.drafts.some((x) => x.kind === "housing_agency"));
  assert.ok(noCounselor.warnings.some((w) => w.includes("Add the housing counselor")));

  const one = buildPlan(resolveDates(sampleContract({ grant_counselor: { name: "Jasmaine Williams", email: "jwilliams@ahcopa.org", phone: null } })));
  const d = one.drafts.find((x) => x.kind === "housing_agency")!;
  assert.deepEqual(d.to, ["jwilliams@ahcopa.org"]);
  assert.equal(d.subject, "5722 Malcolm St – Alexis McIntosh is under contract");
  assert.ok(d.body.startsWith("Hi Jasmaine,\n\nI hope you're doing well! Our mutual client, Alexis McIntosh, is now under contract on 5722 Malcolm St, and I wanted to check in on what's needed to get Alexis's file submitted."));
  assert.ok(d.body.endsWith("Talk soon,\nJasmine"));
  assert.ok(!one.warnings.some((w) => w.includes("Add the housing counselor")));

  const two = buildPlan(resolveDates(sampleContract({
    grant_counselor: { name: "Pat Green", email: "pgreen@housing.org", phone: null },
    buyers: [{ name: "Ana Ruiz", email: "ana@example.com", phone: null }, { name: "Ben Ruiz", email: null, phone: null }],
  })));
  const t = two.drafts.find((x) => x.kind === "housing_agency")!;
  assert.ok(t.body.startsWith("Hi Pat,"));
  assert.ok(t.body.includes("Our mutual clients, Ana Ruiz and Ben Ruiz, are now under contract"));
  assert.ok(t.body.includes("to get Ana and Ben's file submitted"));

  const listing = buildPlan(resolveDates(sampleContract({ side: "Listing", grant_counselor: { name: "Pat", email: "p@h.org", phone: null } })));
  assert.ok(!listing.drafts.some((x) => x.kind === "housing_agency"));
});

test("buyer welcome email: cash LLC with informational inspections (Forrest Ave)", () => {
  const plan = buildPlan(resolveDates(sampleContract({
    property: { address: "7076 Forrest Ave", city: "Philadelphia", zip: "19138" },
    price: 260000, deposit_amount: 5000, financing_type: "Cash", lender: null, grant_program: null,
    buyers: [{ name: "Buliani Smith", email: "bulisani@gmail.com", phone: null }],
    buyer_entity: { name: "DBBB LLC", signer: "Buliani Smith" },
    inspection_type: "informational_only",
    possession: "Vacant and broom-clean at settlement; the tenants' belongings are excluded",
  })));
  const b = plan.drafts.find((x) => x.kind === "buyer_congrats")!.body;
  assert.ok(b.startsWith("Hi Buliani,\n\nCONGRATULATIONS! Your offer on 7076 Forrest Ave was accepted, and a copy of the fully signed Agreement of Sale for DBBB LLC is attached."));
  assert.ok(b.includes("• Thursday, October 15 — Deposit due ($5,000)"));
  assert.ok(b.includes("• As soon as possible — Schedule and complete your inspections"));
  assert.ok(b.includes("• Friday, November 13 — Settlement (closing day)"));
  assert.ok(!b.includes("Mortgage application due"));
  assert.ok(b.includes("Financing: Cash purchase (no mortgage)"));
  assert.ok(b.includes("CASH PURCHASE"));
  assert.ok(b.includes("cashier's check over $25,000"));
  assert.ok(b.includes("for informational purposes only"));
  assert.ok(b.includes("POSSESSION\nVacant and broom-clean at settlement; the tenants' belongings are excluded. We will confirm this at the final walk-through."));
  assert.ok(b.includes(WIRE_LINE));
  assert.ok(b.includes("landlord or dwelling policy in the name of DBBB LLC"));
  assert.ok(b.includes("to close in the name of DBBB LLC"));
  assert.ok(b.includes("put the utilities in your company's name as of settlement day, November 13."));
  assert.ok(b.endsWith("Client Care\nThe Buy SMART Team\nRealty ONE Group Focus"));
  assert.ok(!/be honest with me/i.test(b));
});

test("buyer welcome email: mortgage with an inspection deadline", () => {
  const plan = buildPlan(resolveDates(sampleContract()));
  const b = plan.drafts.find((x) => x.kind === "buyer_congrats")!.body;
  assert.ok(b.includes("• Saturday, October 17 — Mortgage application due"));
  assert.ok(b.includes("• Tuesday, October 20 — Inspections done and your reply to the seller due"));
  assert.ok(b.includes("• Tuesday, November 3 — Mortgage commitment due"));
  assert.ok(b.includes("Financing: FHA mortgage with First Citizens Community Bank"));
  assert.ok(b.includes("YOUR MORTGAGE") && !b.includes("CASH PURCHASE"));
  assert.ok(b.includes("gives you until Tuesday, October 20 to complete your inspections"));
  assert.ok(!b.includes("POSSESSION"));
  assert.ok(b.includes("homeowners insurance quote") && b.includes("Your lender will need proof of the policy"));
  assert.ok(!b.includes("LLC"));
});

test("co-op coordinator is copied on key dates on listings too, and unnamed people are flagged", () => {
  const listing = buildPlan(resolveDates(sampleContract({
    side: "Listing",
    buyer_agent: { name: "Sam Lee", email: "sam@coop.com", phone: null, brokerage: "Coop Realty" },
    coop_coordinator: { name: "Rae Kim", email: "rae@cooptc.com", phone: null },
  })));
  assert.ok(listing.drafts.find((d) => d.kind === "agent_timeline")!.cc.includes("rae@cooptc.com"));
  assert.equal(listing.deal.coop_tc, "Rae Kim");

  const unnamed = buildPlan(resolveDates(sampleContract({
    grant_counselor: { name: null, email: "counselor@housing.org", phone: null },
    coop_coordinator: { name: " ", email: "tc@other.com", phone: null },
  })));
  assert.ok(unnamed.warnings.some((w) => w.includes("housing counselor's name")));
  assert.ok(unnamed.warnings.some((w) => w.includes("co-op transaction coordinator's name")));
  const named = buildPlan(resolveDates(sampleContract({ grant_counselor: { name: "Pat Green", email: "pgreen@housing.org", phone: null } })));
  assert.equal(named.deal.housing_counselor, "Pat Green");
  assert.equal(named.deal.housing_counselor_email, "pgreen@housing.org");
  assert.ok(!named.warnings.some((w) => w.includes("name.")));
});

test("people on the file are offered to Contacts, with names, once each", () => {
  const plan = buildPlan(resolveDates(sampleContract({
    grant_counselor: { name: "Pat Green", email: "pgreen@housing.org", phone: "215-555-0100" },
    coop_coordinator: { name: "Tara Ruiz", email: "tara@listingtc.com", phone: null },
  })));
  const byEmail = Object.fromEntries(plan.contacts.map((x) => [x.email, x]));
  assert.equal(byEmail["pgreen@housing.org"].name, "Pat Green");
  assert.equal(byEmail["pgreen@housing.org"].role, "Housing counselor (Affordable Housing Centers of PA)");
  assert.equal(byEmail["tara@listingtc.com"].role, "Co-op transaction coordinator");
  assert.equal(byEmail["dave@example.com"].role, "Listing agent");
  assert.ok(!plan.contacts.some((x) => x.email === "jwilliams@gremom.com"));
  assert.equal(new Set(plan.contacts.map((x) => x.email)).size, plan.contacts.length);
});
