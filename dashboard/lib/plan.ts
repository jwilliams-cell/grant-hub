// Turns a contract Jaz has confirmed into everything intake creates: the deal row, milestones,
// calendar events and drafts. Pure, so it can be shown before anything is written, and tested.

import { addDays, businessDaysBefore, isISODate } from "./dates.ts";
import {
  clientName, clientPeople, dealSlug, lastName, DATE_LABELS, type Contract, type ContractDateValue, type DateKey,
} from "./contract.ts";
import {
  agentTimeline, buyerCongrats, grantReminder, housingAgency, lenderIntro, llcDocuments, titleOrder, JAZ_EMAIL, QUICK_ABSTRACT,
  type DayOneFacts, type EmailDraft,
} from "./templates.ts";
import { isSkySlopeAddress } from "./skyslope.ts";
import { documentFilename } from "./naming.ts";
import { formatTeam, type TeamMember } from "./team.ts";
import type { Contact, Deal, Milestone } from "./types.ts";

export interface PlannedMilestone extends Omit<Milestone, "calendar_event_id" | "source_link"> {
  calendar: boolean;
}

export interface IntakePlan {
  dealId: string;
  folderName: string;
  contractFilename: string;
  deal: Omit<Deal, "drive_folder_id">;
  milestones: PlannedMilestone[];
  drafts: EmailDraft[];
  /** Team members Jaz switched on: invited to the calendar deadlines (her switch is the approval). */
  calendarGuests: TeamMember[];
  /** People on this file to add to the Contacts tab (the intake skips any email already there). */
  contacts: Contact[];
  warnings: string[];
}

type PersonValueLike = { name: string | null; email: string | null };
const BLOCKED_BY_TITLE = /@(gmail|yahoo|aol)\./i;
/** SkySlope addresses can't be guessed; accept only what Jaz pasted, and only an @skyslope.com address. */
const validSkySlope = isSkySlopeAddress;
const notJaz = (emails: string[]) => [...new Set(emails.filter((e) => e && e.toLowerCase() !== JAZ_EMAIL))];

function isCash(financing: string | null): boolean {
  return !!financing && /cash/i.test(financing);
}

export function buildPlan(c: Contract): IntakePlan {
  const address = c.property.address.trim();
  const dealId = dealSlug(address);
  const d = c.dates;
  const date = (k: DateKey) => (isISODate(d[k].date) ? d[k].date : null);
  const settlement = date("settlement");
  const execution = date("execution");
  const cash = isCash(c.financing_type);
  const warnings: string[] = [...c.open_questions];

  const isListing = c.side === "Listing";
  const otherAgent = isListing ? c.buyer_agent : c.listing_agent;
  // On Jaz's buyer files a second buyer agent is her co-agent; on her listings it's the other side's.
  const coAgent = !isListing ? c.buyer_agent_2 : null;
  const otherSecondAgent = isListing ? c.buyer_agent_2 : null;
  const coopCoordinator = c.coop_coordinator;
  const team = (c.team_on_file ?? []).filter((t) => t.email.trim());
  // Down payment assistance: Jaz's switch decides; otherwise a named program in the contract means yes.
  const dpa = c.uses_dpa ?? !!c.grant_program;
  const program = dpa ? c.grant_program?.trim() || "down payment assistance program" : null;
  const titleCo = c.title?.company?.trim() || QUICK_ABSTRACT.name;
  const usesQuickAbstract = /quick abstract/i.test(titleCo);

  const deal: IntakePlan["deal"] = {
    deal_id: dealId,
    address,
    client: clientName(c),
    client_email: clientPeople(c).map((p) => p.email).filter(Boolean).join(", "),
    side: c.side,
    status: "Active",
    price: c.price != null ? String(c.price) : "",
    financing: c.financing_type ?? "",
    lender: c.lender?.company ?? "",
    loan_officer_email: c.lender?.loan_officer?.email ?? "",
    loan_officer: c.lender?.loan_officer?.name ?? "",
    team_on_file: formatTeam(team),
    processor_email: c.lender?.processor?.email ?? "",
    title_co: titleCo,
    title_file_no: c.title?.file_no ?? "",
    other_agent: [otherAgent?.name, otherAgent?.brokerage].filter(Boolean).join(", "),
    other_agent_email: otherAgent?.email ?? "",
    execution_date: execution ?? "",
    settlement_date: settlement ?? "",
    settlement_time: "",
    skyslope_email: validSkySlope(c.skyslope_email) ? c.skyslope_email!.trim() : "Confirm",
    grant_program: program ?? "",
    buyer_agent_2: [c.buyer_agent_2?.name, c.buyer_agent_2?.brokerage].filter(Boolean).join(", "),
    buyer_agent_2_email: c.buyer_agent_2?.email ?? "",
    coop_tc: c.coop_coordinator?.name ?? "",
    coop_tc_email: c.coop_coordinator?.email ?? "",
    housing_counselor: c.grant_counselor?.name ?? "",
    housing_counselor_email: c.grant_counselor?.email ?? "",
    savings_counselor: dpa ? c.savings_counselor?.name ?? "" : "",
    savings_counselor_email: dpa ? c.savings_counselor?.email ?? "" : "",
    notes: [c.seller_assist && `Seller assist: ${c.seller_assist}`, c.settlement_place && `Settlement at ${c.settlement_place}`]
      .filter(Boolean)
      .join(". "),
  };

  // --- Milestones, in the order the file is worked ---
  const milestones: PlannedMilestone[] = [];
  const add = (step: string, due: string | null, dateType: string, status: string, owner: string, note = "", calendar = true) =>
    milestones.push({
      deal_id: dealId, seq: String(milestones.length + 1), step, due: due ?? "",
      date_type: due ? dateType : "Unknown", status, owner, note: due ? note : [note, "Confirm the date"].filter(Boolean).join(". "),
      calendar: calendar && !!due && status !== "Done",
    });
  const fromContract = (k: DateKey, step: string, owner: string, note = "") => {
    const v: ContractDateValue = d[k];
    add(step, date(k), "Contract", "To do", owner, [note, v.source && `Contract: ${v.source}`].filter(Boolean).join(". "));
  };
  const buyerLabel = isListing ? "Buyer (other side)" : "Client";
  const otherAgentLabel = otherAgent?.name ? `${otherAgent.name.split(" ")[0]} (${isListing ? "buyer's agent" : "listing agent"})` : "Other agent";

  add("Under contract — Agreement of Sale fully signed", execution, "Actual", "Done", "Jaz", "", false);
  add("Title ordered", execution, "Target", "To do", "Jaz", usesQuickAbstract ? "Title order is in Jaz's drafts" : `Title is with ${titleCo}`);
  fromContract("deposit_due", "Deposit received by title (escrow receipt)", buyerLabel, c.deposit_amount ? `Deposit $${c.deposit_amount.toLocaleString("en-US")}` : "");
  if (!cash) fromContract("mortgage_application_due", "Mortgage application complete", "Lender / client");
  if ((isListing ? c.seller_entity : c.buyer_entity)?.name) {
    add("LLC documents to title: operating agreement, certificate of organization, tax ID letter", execution ? addDays(execution, 7) : null, "Target", "To do", buyerLabel);
  }
  fromContract("inspection_contingency_end", "Reply to inspection due", "Jaz", "Inspection negotiations stay with Jaz");
  fromContract("seller_response_end", "Seller's response to inspection reply", otherAgentLabel);
  if (!cash) {
    if (date("appraisal_contingency_end")) fromContract("appraisal_contingency_end", "Appraisal", "Lender");
    else add("Appraisal", null, "Target", "To do", "Lender", "", false);
    fromContract("mortgage_commitment", "Mortgage commitment", "Lender");
  }
  for (const other of c.other_deadlines) {
    add(other.label, isISODate(other.date) ? other.date : null, "Contract", "To do", "Jaz", other.source ? `Contract: ${other.source}` : "");
  }
  if (program) {
    add(`Grant package to counselor (${program}) — every document in one email`, settlement ? addDays(settlement, -30) : null, "Target", "To do", "Jaz");
  }
  if (!cash) {
    add("Homeowners insurance bound; binder to lender", settlement ? addDays(settlement, -7) : null, "Target", "To do", buyerLabel);
    add("Clear to close from lender", settlement ? businessDaysBefore(settlement, 4) : null, "Target", "To do", "Lender");
    add("Closing disclosure signed (3 business days before settlement)", settlement ? businessDaysBefore(settlement, 3) : null, "Target", "To do", "Lender / client");
  }
  add("Final walk-through", settlement ? addDays(settlement, -1) : null, "Target", "To do", "Jaz / Kenya");
  add("Settlement", settlement, "Contract", "Scheduled", titleCo, [c.settlement_place, d.settlement.source && `Contract: ${d.settlement.source}`].filter(Boolean).join(". "));
  add("Final signed documents and compliance file to brokerage", settlement ? addDays(settlement, 3) : null, "Target", "To do", "Jaz", "", true);

  // --- Drafts ---
  const facts: DayOneFacts = {
    address,
    buyerNames: c.buyer_entity?.name || c.buyers.map((b) => b.name).filter(Boolean).join(" & ") || "our buyer",
    buyerEmails: c.buyers.map((b) => b.email).filter((e): e is string => !!e),
    sellerNames: c.seller_entity?.name || c.sellers.map((s) => s.name).filter(Boolean).join(" & "),
    coopAgentName: [otherAgent?.name, otherAgent?.brokerage].filter(Boolean).join(", "),
    coopAgentEmail: otherAgent?.email ?? "",
    coAgentName: coAgent?.name ?? "",
    coAgentEmail: coAgent?.email ?? "",
    teamCc: [coAgent?.email ?? "", ...team.map((t) => t.email)].filter(Boolean),
    otherSideCc: [otherSecondAgent?.email, coopCoordinator?.email].filter((e): e is string => !!e),
    lenderName: c.lender?.company ?? "",
    loanOfficerName: c.lender?.loan_officer?.name ?? "",
    loanOfficerEmail: c.lender?.loan_officer?.email ?? "",
    processorEmail: c.lender?.processor?.email ?? "",
    dates: (["execution", "deposit_due", "mortgage_application_due", "inspection_contingency_end", "mortgage_commitment", "settlement"] as DateKey[])
      .filter((k) => !(cash && (k === "mortgage_application_due" || k === "mortgage_commitment")))
      .map((k) => ({ label: DATE_LABELS[k], date: date(k) })),
    executionDate: execution,
    mortgageApplication: date("mortgage_application_due"),
    commitment: date("mortgage_commitment"),
    settlement,
  };

  const drafts: EmailDraft[] = [];
  if (isListing) {
    drafts.push(agentTimeline(facts));
    warnings.push("Listing side: the seller-side conveyancing email to the buyer's title company still needs to be written by hand.");
  } else {
    if (usesQuickAbstract) drafts.push(titleOrder(facts));
    else warnings.push(`Title is with ${titleCo}, not Quick Abstract. No title order draft was made.`);
    if (!cash) {
      if (facts.loanOfficerEmail) drafts.push(lenderIntro(facts));
      else warnings.push("No loan officer email in the contract, so the lender introduction wasn't drafted.");
    }
    if (facts.coopAgentEmail) drafts.push(agentTimeline(facts));
    else warnings.push("No listing agent email in the contract, so the key dates email wasn't drafted.");
    if (facts.buyerEmails.length) {
      const entity = c.buyer_entity?.name ?? null;
      const firstNames = c.buyers.map((b) => b.name?.trim().split(/\s+/)[0]).filter(Boolean) as string[];
      drafts.push(buyerCongrats(facts, {
        greetingNames: firstNames.join(" and ") || c.buyer_entity?.signer?.split(/\s+/)[0] || "",
        entityName: entity,
        price: c.price,
        deposit: c.deposit_amount,
        depositDue: date("deposit_due"),
        cash,
        financingType: c.financing_type,
        loanTermYears: c.loan_term_years,
        loanOfficerName: c.lender?.loan_officer?.name ?? "",
        sellerCredit: c.seller_credit,
        negotiationEnd: date("seller_response_end"),
        inspectionsChosen: c.inspections_chosen,
        disclosureContingency: c.seller_disclosure_contingency,
        inspectionType: c.inspection_type,
        inspectionDue: date("inspection_contingency_end"),
        possession: c.possession,
        titleCompany: titleCo,
        quickAbstract: usesQuickAbstract,
      }));
    } else warnings.push("No buyer email in the contract, so the congratulations email wasn't drafted.");
    if (c.buyer_entity?.name && facts.buyerEmails.length) drafts.push(llcDocuments(facts, c.buyer_entity.name));
    // Housing agency: counselors change by program, so Jaz enters one per file. Drafted only once there's an email.
    if (dpa && c.grant_counselor?.email) {
      const people = c.buyers.map((b) => b.name).filter((n): n is string => !!n);
      drafts.push(housingAgency(facts, people, { name: c.grant_counselor.name ?? "", email: c.grant_counselor.email }));
    } else if (program) {
      warnings.push(`This file has a housing program (${program}). Add the housing counselor's name and email on this page to draft the housing agency email.`);
    }
  }
  if (program) drafts.push(grantReminder(facts, program, settlement ? addDays(settlement, -30) : null));

  // Every person on the file needs a name: emails greet them by it, and the dashboard lists them.
  const unnamed: [string, PersonValueLike | null | undefined][] = [
    ["housing counselor", dpa ? c.grant_counselor : null], ["savings counselor", dpa ? c.savings_counselor : null], ["co-op transaction coordinator", c.coop_coordinator], ["loan officer", c.lender?.loan_officer], ["second buyer agent", c.buyer_agent_2],
  ];
  for (const [label, p] of unnamed) {
    if (p?.email && !p.name?.trim()) warnings.push(`Add the ${label}'s name. There's an email for them but no name.`);
  }
  if (c.skyslope_email?.trim() && !validSkySlope(c.skyslope_email)) {
    warnings.push("The SkySlope email should end in @skyslope.com. Copy it from the EMAIL field on the SkySlope transaction page.");
  } else if (!c.skyslope_email?.trim()) {
    warnings.push("No SkySlope email yet. Copy it from the EMAIL field on the SkySlope transaction page, or add it to the tracker later.");
  }
  if (usesQuickAbstract && facts.buyerEmails.some((e) => BLOCKED_BY_TITLE.test(e))) {
    warnings.push("The buyer uses a Gmail, Yahoo or AOL address. Quick Abstract's server blocks those, so forward title's emails to them.");
  }
  if (c.financing_type && /housing finance|phfa/i.test(c.financing_type)) {
    warnings.push("Housing finance agency loans run slow. Check on this one weekly.");
  }
  for (const k of Object.keys(d) as DateKey[]) {
    if (d[k].confirm && !(cash && (k === "mortgage_application_due" || k === "mortgage_commitment" || k === "appraisal_contingency_end"))) {
      warnings.push(`${DATE_LABELS[k]}: confirm the date${d[k].date ? ` (${d[k].date})` : ""}.`);
    }
  }

  const contacts: Contact[] = [];
  const addContact = (p: { name: string | null; email: string | null; phone?: string | null } | null | undefined, role: string, company = "") => {
    if (!p?.email?.trim() || p.email.toLowerCase() === JAZ_EMAIL || contacts.some((x) => x.email.toLowerCase() === p.email!.toLowerCase())) return;
    contacts.push({ name: p.name?.trim() || "Name to confirm", role, company, email: p.email.trim(), phone: p.phone ?? "", notes: `Added from ${address}` });
  };
  if (dpa) {
    addContact(c.grant_counselor, `Housing counselor${program ? ` (${program})` : ""}`);
    addContact(c.savings_counselor, `Savings counselor${program ? ` (${program})` : ""}`);
  }
  addContact(c.coop_coordinator, "Co-op transaction coordinator", otherAgent?.brokerage ?? "");
  addContact(coAgent, "Co-agent (buyer side)", coAgent?.brokerage ?? "");
  addContact(otherAgent, isListing ? "Buyer's agent" : "Listing agent", otherAgent?.brokerage ?? "");
  addContact(otherSecondAgent, "Buyer's agent", otherSecondAgent?.brokerage ?? "");
  addContact(c.lender?.loan_officer, "Loan officer", c.lender?.company ?? "");
  addContact(c.lender?.processor, "Processor", c.lender?.company ?? "");

  const folderName = `${address} – ${lastName(c)}`;
  return {
    dealId,
    folderName,
    contractFilename: documentFilename({ address, clientLastName: lastName(c), document: "Agreement of Sale", date: execution }),
    deal,
    milestones,
    calendarGuests: team,
    contacts,
    // Jaz never needs a copy of her own email, e.g. as listing agent on a dual file. Her grant reminder is the exception.
    drafts: drafts
      .map((x) => (x.kind === "grant_reminder" ? x : { ...x, to: notJaz(x.to), cc: notJaz(x.cc).filter((e) => !x.to.includes(e)) }))
      .filter((x) => x.to.length > 0),
    warnings: [...new Set(warnings)],
  };
}
