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
  seller_response_end: "Seller's response period ends",
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
  grant_program: z.string().nullable().describe("Grant or down payment assistance program, if any"),
  items_included_excluded: z.string().nullable(),
  buyers: z.array(Person),
  sellers: z.array(Person),
  buyer_entity: Entity.nullable(),
  seller_entity: Entity.nullable(),
  listing_agent: Agent.nullable(),
  buyer_agent: Agent.nullable(),
  listing_coordinator: Person.nullable().describe("Listing side transaction coordinator, if named"),
  lender: z
    .object({ company: z.string().nullable(), loan_officer: Person.nullable(), processor: Person.nullable() })
    .nullable(),
  title: z.object({ company: z.string().nullable(), file_no: z.string().nullable() }).nullable(),
  grant_counselor: Person.nullable(),
  dates: z.object(Object.fromEntries(DATE_KEYS.map((k) => [k, ContractDate])) as Record<DateKey, typeof ContractDate>),
  settlement_place: z.string().nullable(),
  other_deadlines: z
    .array(ContractDate.extend({ label: z.string() }))
    .describe("Anything else time-bound in the addenda: leaseback, solar lease transfer, repairs to complete"),
  open_questions: z.array(z.string()).describe("Anything Jasmine needs to confirm, in plain words"),
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
