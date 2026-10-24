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
    listing_coordinator: null,
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
    assert.ok(d.body.trimEnd().endsWith("Jasmine") || d.kind === "grant_reminder");
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
    listing_coordinator: { name: "Tara Ruiz", email: "tara@listingtc.com", phone: null },
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
  assert.equal(plan.deal.listing_tc_email, "tara@listingtc.com");
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
