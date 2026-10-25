import { z } from "zod";
import { addDays, isISODate } from "./dates.ts";

// What Claude pulls out of a ratified Agreement of Sale (transaction-coordinator.md, Workflow 1, Step 1).
// Shared by the server (extraction) and the review form (editing), so it has no server imports.

const Person = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

const Agent = Person.extend({ brokerage: z.string().nullable() });

const Entity = z.object({
  name: z.string().describe("Legal name of the LLC or other entity"),
  signer: z.string().nullable().describe("Person who signed for the entity"),
});

const ContractDate = z.object({
  date: z.string().nullable().describe("Calendar date as YYYY-MM-DD, counted out if the contract gives a number of days"),
  days_after_execution: z.number().nullable().describe("The number of days after execution, when the contract states it that way"),
  source: z.string().nullable().describe("Short quote or paragraph reference from the contract this came from"),
  confirm: z.boolean().describe("True when the date could not be confirmed from the documents"),
});

/** How the Agreement of Sale treats inspections. */
export const INSPECTION_TYPES = ["contingency", "informational_only", "waived", "unknown"] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const DATE_KEYS = [
  "execution",
  "deposit_due",
  "mortgage_application_due",
  "inspection_contingency_end",
  "seller_response_end",
  "appraisal_contingency_end",
  "mortgage_commitment",
  "settlement",
] as const;
export type DateKey = (typeof DATE_KEYS)[number];

export const DATE_LABELS: Record<DateKey, string> = {
  execution: "Execution date",
  deposit_due: "Deposit due",
  mortgage_application_due: "Mortgage application due",
  inspection_contingency_end: "Reply to inspection due",
  seller_response_end: "Repair negotiation period ends",
  appraisal_contingency_end: "Appraisal contingency ends",
  mortgage_commitment: "Mortgage commitment",
  settlement: "Settlement",
};

export const ContractSchema = z.object({
  property: z.object({
    address: z.string().describe("Street address only, e.g. '5722 Malcolm St'"),
    city: z.string().nullable(),
    zip: z.string().nullable(),
  }),
  side: z.enum(["Buyer", "Listing", "Dual"]).describe("Which side Jasmine Williams represents"),
  price: z.number().nullable(),
  deposit_amount: z.number().nullable(),
  seller_assist: z.string().nullable().describe("Seller assist or credits, in words with amounts"),
  financing_type: z.string().nullable().describe("Conventional, FHA, VA, cash, hard money or refinance"),
  loan_amount: z.number().nullable(),
  seller_credit: z.number().nullable(),
  loan_term_years: z.number().nullable(),
  inspections_chosen: z.array(z.string()),
  seller_disclosure_contingency: z.boolean(),
  grant_program: z.string().nullable().describe("Grant or down payment assistance program, if any"),
  items_included_excluded: z.string().nullable(),
  buyers: z.array(Person),
  sellers: z.array(Person),
  buyer_entity: Entity.nullable(),
  seller_entity: Entity.nullable(),
  listing_agent: Agent.nullable(),
  buyer_agent: Agent.nullable(),
  buyer_agent_2: Agent.nullable().describe("A second agent on the buyer side, if the contract names one"),
  coop_coordinator: Person.nullable().describe("Transaction coordinator for the other side of the deal (the co-op side), if named"),
  lender: z
    .object({ company: z.string().nullable(), loan_officer: Person.nullable(), processor: Person.nullable() })
    .nullable(),
  title: z.object({ company: z.string().nullable(), file_no: z.string().nullable() }).nullable(),
  grant_counselor: Person.nullable(),
  dates: z.object(Object.fromEntries(DATE_KEYS.map((k) => [k, ContractDate])) as Record<DateKey, typeof ContractDate>),
  settlement_place: z.string().nullable(),
  inspection_type: z.enum(INSPECTION_TYPES),
  possession: z.string().nullable().describe("How the property is delivered at settlement, e.g. vacant and broom-clean, tenant-occupied"),
  other_deadlines: z
    .array(ContractDate.extend({ label: z.string() }))
    .describe("Anything else time-bound in the addenda: leaseback, solar lease transfer, repairs to complete"),
  open_questions: z.array(z.string()).describe("Anything Jasmine needs to confirm, in plain words"),
  // Not in the contract: Jaz pastes it from the SkySlope transaction page on the review screen.
  skyslope_email: z.string().nullable().optional(),
  // Not in the contract: team members Jaz switches on for this file (copied on emails, invited to deadlines).
  team_on_file: z.array(z.object({ name: z.string(), email: z.string() })).optional(),
});

export type Contract = z.infer<typeof ContractSchema>;
export type ContractDateValue = z.infer<typeof ContractDate>;
export type PersonValue = z.infer<typeof Person>;

/**
 * Counts out "X days after execution" dates the model left blank, and flags any date that is
 * still missing or malformed. Never overwrites a date the contract states outright.
 */
export function resolveDates(contract: Contract): Contract {
  const exec = contract.dates.execution.date;
  const fix = (d: ContractDateValue): ContractDateValue => {
    let next = { ...d };
    if (!isISODate(next.date) && next.days_after_execution != null && isISODate(exec)) {
      next = { ...next, date: addDays(exec, next.days_after_execution) };
    }
    if (!isISODate(next.date)) next = { ...next, date: null, confirm: true };
    return next;
  };
  const dates = Object.fromEntries(DATE_KEYS.map((k) => [k, fix(contract.dates[k])]));
  return {
    ...contract,
    dates: dates as Contract["dates"],
    other_deadlines: contract.other_deadlines.map((d) => ({ ...fix(d), label: d.label })),
  };
}

export function lastName(contract: Contract): string {
  if (contract.side === "Listing") {
    if (contract.seller_entity?.name) return contract.seller_entity.name;
    return contract.sellers[0]?.name?.trim().split(/\s+/).pop() ?? "Seller";
  }
  if (contract.buyer_entity?.name) return contract.buyer_entity.name;
  return contract.buyers[0]?.name?.trim().split(/\s+/).pop() ?? "Buyer";
}

export function clientPeople(contract: Contract): PersonValue[] {
  return contract.side === "Listing" ? contract.sellers : contract.buyers;
}

export function clientName(contract: Contract): string {
  const entity = contract.side === "Listing" ? contract.seller_entity : contract.buyer_entity;
  if (entity?.name) return entity.name;
  return clientPeople(contract).map((p) => p.name).filter(Boolean).join(" & ") || "Confirm";
}

export function dealSlug(address: string): string {
  const words = address.toLowerCase().replace(/[.,#]/g, "").split(/\s+/).filter(Boolean);
  if (["st", "ave", "rd", "dr", "ln", "ter", "blvd", "pl", "ct", "way", "street", "avenue", "road", "drive"].includes(words.at(-1)!)) {
    words.pop();
  }
  return words.join("-").replace(/[^a-z0-9-]/g, "");
}

// --- What Claude fills in ---
// Structured outputs allow at most 16 nullable or union-typed fields, and ContractSchema has far
// more. So Claude fills a version with no unions: "" means not in the contract, 0 means no amount,
// and -1 means the deadline isn't stated as days after execution. fromWire() turns it back into a
// Contract with nulls, which is what the review form and the plan use.

const WirePerson = z.object({
  name: z.string().describe('Full name, or "" if not in the contract'),
  email: z.string().describe('Email, or "" if not in the contract'),
  phone: z.string().describe('Phone, or "" if not in the contract'),
});
const WireAgent = WirePerson.extend({ brokerage: z.string().describe('Brokerage, or ""') });
const WireEntity = z.object({
  name: z.string().describe('Legal name of the LLC or other entity, or "" if this party is a person'),
  signer: z.string().describe('Person who signed for the entity, or ""'),
});
const WireDate = z.object({
  date: z.string().describe('Calendar date as YYYY-MM-DD, counted out if the contract gives a number of days; "" if unknown'),
  days_after_execution: z.number().describe("Number of days after execution when the contract states it that way; -1 otherwise"),
  source: z.string().describe('Short quote or paragraph reference from the contract, or ""'),
  confirm: z.boolean().describe("True when the date could not be confirmed from the documents"),
});

export const ContractWireSchema = z.object({
  property: z.object({
    address: z.string().describe("Street address only, e.g. '5722 Malcolm St'"),
    city: z.string().describe('City, or ""'),
    zip: z.string().describe('ZIP code, or ""'),
  }),
  side: z.enum(["Buyer", "Listing", "Dual"]).describe("Which side Jasmine Williams represents"),
  price: z.number().describe("Purchase price in dollars; 0 if not stated"),
  deposit_amount: z.number().describe("Deposit in dollars; 0 if not stated"),
  seller_assist: z.string().describe('Seller assist or credits, in words with amounts; "" if none'),
  financing_type: z.string().describe('Conventional, FHA, VA, cash, hard money or refinance; "" if not stated'),
  loan_amount: z.number().describe("Loan amount in dollars; 0 if not stated"),
  seller_credit: z.number().describe("Seller credit toward the buyer's closing costs, in dollars; 0 if none"),
  loan_term_years: z.number().describe("Mortgage term in years, e.g. 30; 0 if not stated or cash"),
  inspections_chosen: z
    .array(z.string())
    .describe("Each inspection the buyer elected in the agreement, in plain words, e.g. 'Home inspection', 'Termite (wood-destroying insect) inspection', 'Sewer line inspection', 'Homeowners and flood insurance review'"),
  seller_disclosure_contingency: z.boolean().describe("True if the offer is contingent on the buyer receiving and approving the seller's property disclosure statement"),
  grant_program: z.string().describe('Grant or down payment assistance program; "" if none'),
  items_included_excluded: z.string().describe('Items included or excluded; "" if none'),
  buyers: z.array(WirePerson),
  sellers: z.array(WirePerson),
  buyer_entity: WireEntity,
  seller_entity: WireEntity,
  listing_agent: WireAgent,
  buyer_agent: WireAgent,
  buyer_agent_2: WireAgent.describe("A second licensee on the buyer side (co-agent or team member); all fields empty if none"),
  coop_coordinator: WirePerson.describe("Transaction coordinator for the side Jasmine does not represent (the co-op side), if the contract or addenda name one; all fields empty if none"),
  lender: z.object({ company: z.string(), loan_officer: WirePerson, processor: WirePerson }),
  title: z.object({ company: z.string(), file_no: z.string() }),
  grant_counselor: WirePerson.describe("Housing counselor for a grant or housing program, if named; all fields empty if none"),
  dates: z.object(Object.fromEntries(DATE_KEYS.map((k) => [k, WireDate])) as Record<DateKey, typeof WireDate>),
  settlement_place: z.string().describe('Settlement place, or ""'),
  inspection_type: z
    .enum(INSPECTION_TYPES)
    .describe("contingency: buyer can negotiate or terminate after inspections; informational_only: inspections for the buyer's information only; waived: buyer waived inspections; unknown if unclear"),
  possession: z.string().describe('How the property is delivered at settlement (vacant, broom-clean, tenants, items excluded), in plain words; "" if not stated'),
  other_deadlines: z
    .array(WireDate.extend({ label: z.string() }))
    .describe("Anything else time-bound in the addenda: leaseback, solar lease transfer, repairs to complete"),
  open_questions: z.array(z.string()).describe("Anything Jasmine needs to confirm, in plain words"),
});

export type ContractWire = z.infer<typeof ContractWireSchema>;

const str = (s: string): string | null => (s.trim() === "" ? null : s.trim());
const num = (n: number): number | null => (n > 0 ? n : null);
const person = (p: z.infer<typeof WirePerson>): PersonValue => ({ name: str(p.name), email: str(p.email), phone: str(p.phone) });
const personOrNull = (p: z.infer<typeof WirePerson>) => {
  const v = person(p);
  return v.name || v.email || v.phone ? v : null;
};
const agentOrNull = (a: z.infer<typeof WireAgent>) => {
  const v = { ...person(a), brokerage: str(a.brokerage) };
  return v.name || v.email || v.phone || v.brokerage ? v : null;
};
const entityOrNull = (e: z.infer<typeof WireEntity>) => (str(e.name) ? { name: e.name.trim(), signer: str(e.signer) } : null);
const date = (d: z.infer<typeof WireDate>): ContractDateValue => ({
  date: str(d.date),
  days_after_execution: d.days_after_execution >= 0 ? d.days_after_execution : null,
  source: str(d.source),
  confirm: d.confirm,
});
const notEmpty = (p: PersonValue) => !!(p.name || p.email || p.phone);

export function fromWire(w: ContractWire): Contract {
  const lenderCompany = str(w.lender.company);
  const loanOfficer = personOrNull(w.lender.loan_officer);
  const processor = personOrNull(w.lender.processor);
  const titleCompany = str(w.title.company);
  const fileNo = str(w.title.file_no);
  return {
    property: { address: w.property.address.trim(), city: str(w.property.city), zip: str(w.property.zip) },
    side: w.side,
    price: num(w.price),
    deposit_amount: num(w.deposit_amount),
    seller_assist: str(w.seller_assist),
    financing_type: str(w.financing_type),
    loan_amount: num(w.loan_amount),
    seller_credit: num(w.seller_credit),
    loan_term_years: num(w.loan_term_years),
    inspections_chosen: w.inspections_chosen.map((x) => x.trim()).filter(Boolean),
    seller_disclosure_contingency: w.seller_disclosure_contingency,
    grant_program: str(w.grant_program),
    items_included_excluded: str(w.items_included_excluded),
    buyers: w.buyers.map(person).filter(notEmpty),
    sellers: w.sellers.map(person).filter(notEmpty),
    buyer_entity: entityOrNull(w.buyer_entity),
    seller_entity: entityOrNull(w.seller_entity),
    listing_agent: agentOrNull(w.listing_agent),
    buyer_agent: agentOrNull(w.buyer_agent),
    buyer_agent_2: agentOrNull(w.buyer_agent_2),
    coop_coordinator: personOrNull(w.coop_coordinator),
    lender: lenderCompany || loanOfficer || processor ? { company: lenderCompany, loan_officer: loanOfficer, processor } : null,
    title: titleCompany || fileNo ? { company: titleCompany, file_no: fileNo } : null,
    grant_counselor: personOrNull(w.grant_counselor),
    dates: Object.fromEntries(DATE_KEYS.map((k) => [k, date(w.dates[k])])) as Contract["dates"],
    settlement_place: str(w.settlement_place),
    inspection_type: w.inspection_type,
    possession: str(w.possession),
    other_deadlines: w.other_deadlines.map((d) => ({ ...date(d), label: d.label })),
    open_questions: w.open_questions,
  };
}
