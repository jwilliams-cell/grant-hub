import { test } from "node:test";
import assert from "node:assert/strict";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ContractWireSchema, fromWire, resolveDates, type ContractWire } from "./contract.ts";
import { buildPlan } from "./plan.ts";

// Structured outputs reject schemas with more than 16 nullable or union-typed fields.
function countUnions(schema: unknown): number {
  let n = 0;
  const walk = (o: unknown): void => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach(walk);
    const rec = o as Record<string, unknown>;
    if (rec.anyOf || rec.oneOf || Array.isArray(rec.type)) n++;
    Object.values(rec).forEach(walk);
  };
  walk(schema);
  return n;
}

test("the schema sent to Claude stays under the union limit", () => {
  const format = betaZodOutputFormat(ContractWireSchema) as unknown as { schema: unknown };
  assert.ok(format.schema, "SDK format exposes its JSON schema");
  assert.ok(countUnions(format.schema) <= 16, `unions: ${countUnions(format.schema)}`);
});

const empty = { name: "", email: "", phone: "" };
const noDate = { date: "", days_after_execution: -1, source: "", confirm: true };

test("fromWire turns empty values back into blanks the review form understands", () => {
  const wire: ContractWire = {
    property: { address: " 7076 Forrest Ave ", city: "Philadelphia", zip: "" },
    side: "Dual",
    price: 260000,
    deposit_amount: 0,
    seller_assist: "",
    financing_type: "Cash",
    loan_amount: 0,
    grant_program: "",
    items_included_excluded: "",
    buyers: [{ name: "Dee Brown", email: "", phone: "" }, empty],
    sellers: [{ name: "Asia Woods", email: "", phone: "" }],
    buyer_entity: { name: "DBBB LLC", signer: "Dee Brown" },
    seller_entity: { name: "", signer: "" },
    listing_agent: { ...empty, brokerage: "" },
    buyer_agent: { name: "Jasmine Williams", email: "jwilliams@gremom.com", phone: "", brokerage: "Realty ONE Group Focus" },
    buyer_agent_2: { ...empty, brokerage: "" },
    coop_coordinator: empty,
    lender: { company: "", loan_officer: empty, processor: empty },
    title: { company: "Quick Abstract", file_no: "QA2026-7521" },
    grant_counselor: empty,
    dates: {
      execution: { date: "2026-10-22", days_after_execution: -1, source: "Last signature", confirm: false },
      deposit_due: { date: "", days_after_execution: 5, source: "Paragraph 2", confirm: false },
      mortgage_application_due: noDate,
      inspection_contingency_end: { date: "", days_after_execution: 0, source: "", confirm: false },
      seller_response_end: noDate,
      appraisal_contingency_end: noDate,
      mortgage_commitment: noDate,
      settlement: { date: "2026-11-13", days_after_execution: -1, source: "Paragraph 5", confirm: false },
    },
    settlement_place: "",
    inspection_type: "informational_only",
    possession: "Vacant and broom-clean; tenants' belongings excluded",
    other_deadlines: [],
    open_questions: [],
  };
  const c = resolveDates(fromWire(wire));
  assert.equal(c.property.address, "7076 Forrest Ave");
  assert.equal(c.property.zip, null);
  assert.equal(c.price, 260000);
  assert.equal(c.deposit_amount, null);
  assert.equal(c.buyers.length, 1);
  assert.deepEqual(c.buyer_entity, { name: "DBBB LLC", signer: "Dee Brown" });
  assert.equal(c.seller_entity, null);
  assert.equal(c.listing_agent, null);
  assert.equal(c.lender, null);
  assert.deepEqual(c.title, { company: "Quick Abstract", file_no: "QA2026-7521" });
  assert.equal(c.dates.deposit_due.date, "2026-10-27");
  assert.equal(c.dates.inspection_contingency_end.date, "2026-10-22"); // 0 days after is a real value
  assert.equal(c.dates.mortgage_commitment.date, null);
  assert.equal(c.dates.mortgage_commitment.days_after_execution, null);
  // And the plan builds from it without lender drafts on a cash deal.
  const plan = buildPlan(c);
  assert.equal(plan.dealId, "7076-forrest");
  assert.ok(!plan.drafts.some((d) => d.kind === "lender_intro"));
});
