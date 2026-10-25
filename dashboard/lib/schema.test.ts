import { test } from "node:test";
import assert from "node:assert/strict";
import { fromWire, resolveDates, type ContractWire } from "./contract.ts";
import { CONTRACT_JSON_SCHEMA, extractJsonObject, parseContractReply } from "./contract-json.ts";
import { buildPlan } from "./plan.ts";

const empty = { name: "", email: "", phone: "" };
const noDate = { date: "", days_after_execution: -1, source: "", confirm: true };

function forrestWire(): ContractWire {
  return {
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
    seller_credit: 0,
    loan_term_years: 0,
    inspections_chosen: [" Home inspection ", ""],
    seller_disclosure_contingency: false,
    possession: "Vacant and broom-clean; tenants' belongings excluded",
    other_deadlines: [],
    open_questions: [],
  };
}

test("fromWire turns empty values back into blanks the review form understands", () => {
  const c = resolveDates(fromWire(forrestWire()));
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

test("Claude's JSON reply is found whether bare, fenced or wrapped in a sentence", () => {
  const json = JSON.stringify(forrestWire());
  for (const reply of [json, "```json\n" + json + "\n```", `Here is the contract:\n${json}\nLet me know.`]) {
    const parsed = parseContractReply(reply);
    assert.ok(parsed.ok, reply.slice(0, 20));
    if (parsed.ok) assert.equal(parsed.value.property.address, " 7076 Forrest Ave ");
  }
  assert.equal(extractJsonObject("no json here"), null);
});

test("a reply that doesn't match the form says exactly what's wrong", () => {
  const broken = forrestWire() as unknown as Record<string, unknown>;
  delete broken.inspection_type;
  broken.price = "260000";
  const parsed = parseContractReply(JSON.stringify(broken));
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(parsed.problems, /inspection_type/);
    assert.match(parsed.problems, /price/);
  }
  const bad = parseContractReply("{ not json }");
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.problems, /didn't parse/);
});

test("the schema in the prompt lists every field with its rules", () => {
  const schema = JSON.parse(CONTRACT_JSON_SCHEMA);
  for (const key of ["property", "dates", "inspection_type", "inspections_chosen", "seller_credit", "coop_coordinator", "grant_counselor"]) {
    assert.ok(schema.properties[key], key);
  }
  assert.match(CONTRACT_JSON_SCHEMA, /0 if not stated/);
});
