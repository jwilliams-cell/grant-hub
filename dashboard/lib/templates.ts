// Sarah Cadman's day-one emails and follow-ups (transaction-coordinator.md), in Jaz's voice.
// Plain language, no acronyms, signed "Jasmine". Every buyer email about money carries WIRE_LINE.

import { formatDayMonth, formatLong } from "./dates.ts";
import type { InspectionType } from "./contract.ts";

export const JAZ_EMAIL = "jwilliams@gremom.com";
export const WIRE_LINE =
  "Before you send any money, call the title company at a number you found yourself to confirm the instructions.";
export const QUICK_ABSTRACT = {
  name: "Quick Abstract",
  orders: "titleorders@quickabstract.com",
  closer: "smartin@quickabstract.com",
  /** Main office, from Safiya's signature. Jaz gives it to buyers so they confirm instructions by phone. */
  phone: "215-232-3683",
};

export interface EmailDraft {
  kind: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachContract: boolean;
  reason: string;
}

export interface DayOneFacts {
  address: string;
  buyerNames: string;
  buyerEmails: string[];
  sellerNames: string;
  coopAgentName: string;
  coopAgentEmail: string;
  /** Jaz's co-agent on this file, copied on every day-one email. */
  coAgentName: string;
  coAgentEmail: string;
  /** Jaz's side, copied on every day-one email: her co-agent plus team members switched on for this file. */
  teamCc: string[];
  /** Extra people on the other side to copy on the key dates email: their second agent or their coordinator. */
  otherSideCc: string[];
  lenderName: string;
  loanOfficerName: string;
  loanOfficerEmail: string;
  processorEmail: string;
  dates: { label: string; date: string | null }[];
  executionDate: string | null;
  mortgageApplication: string | null;
  commitment: string | null;
  settlement: string | null;
}

const SIGN = "\n\nThank you!\nJasmine";
const when = (iso: string | null) => (iso ? formatLong(iso) : "to be confirmed");
const list = (dates: DayOneFacts["dates"]) => dates.map((d) => `- ${d.label}: ${when(d.date)}`).join("\n");

export function titleOrder(f: DayOneFacts): EmailDraft {
  return {
    kind: "title_order",
    to: [QUICK_ABSTRACT.orders],
    cc: [QUICK_ABSTRACT.closer, ...f.teamCc].filter(Boolean),
    subject: `${f.address} – Title Order`,
    body: `Hello!\n\nAttached is the signed Agreement of Sale for a new title order for our buyer.\n\nAgent: Jasmine Williams — ${JAZ_EMAIL}${f.coAgentEmail ? `\nCo-agent: ${f.coAgentName || "to follow"} — ${f.coAgentEmail}` : ""}\nBuyer: ${f.buyerNames} — ${f.buyerEmails.join(", ") || "email to follow"}\nCooperating agent: ${f.coopAgentName || "to follow"} — ${f.coopAgentEmail || "email to follow"}\nSeller: ${f.sellerNames || "to follow"}\nLender: ${f.lenderName || "to follow"} — ${f.loanOfficerEmail || "email to follow"}\n\nPlease cc me on all communication.${SIGN}`,
    attachContract: true,
    reason: "Day one: order title",
  };
}

export function lenderIntro(f: DayOneFacts): EmailDraft {
  return {
    kind: "lender_intro",
    to: [f.loanOfficerEmail].filter(Boolean),
    cc: [f.processorEmail, ...f.teamCc].filter(Boolean),
    subject: `${f.address} (${f.buyerNames}) is under contract`,
    body: `Hi ${f.loanOfficerName.trim().split(/\s+/)[0] || "there"},\n\n${f.buyerNames} is officially under contract on ${f.address}; the signed Agreement of Sale is attached.\n\n- Mortgage application: ${when(f.mortgageApplication)}\n- Commitment: ${when(f.commitment)}\n- Settlement: ${when(f.settlement)}\n\nTitle is with Quick Abstract. Please keep me copied and let me know once the application is complete and the appraisal is ordered.${SIGN}`,
    attachContract: true,
    reason: "Day one: introduce the file to the lender",
  };
}

export function agentTimeline(f: DayOneFacts): EmailDraft {
  return {
    kind: "agent_timeline",
    to: [f.coopAgentEmail].filter(Boolean),
    cc: [...f.otherSideCc, ...f.teamCc].filter(Boolean),
    subject: `${f.address} – Key dates`,
    body: `Hi ${f.coopAgentName.split(/[ ,]/)[0] || "there"},\n\nLooking forward to a smooth one together. Here are the key dates. Please confirm or let me know of any discrepancies:\n\n${list(f.dates)}\n\nLender: ${f.lenderName || "to follow"}\nTitle: Quick Abstract — ${QUICK_ABSTRACT.orders}\n\nPlease copy me on all correspondence.${SIGN}`,
    attachContract: false,
    reason: "Day one: key dates to the other agent",
  };
}

/** Deal facts the buyer welcome email switches on. */
export interface WelcomeFacts {
  greetingNames: string;
  entityName: string | null;
  price: number | null;
  deposit: number | null;
  depositDue: string | null;
  cash: boolean;
  financingType: string | null;
  loanTermYears: number | null;
  loanOfficerName: string;
  sellerCredit: number | null;
  inspectionType: InspectionType;
  inspectionDue: string | null;
  negotiationEnd: string | null;
  inspectionsChosen: string[];
  disclosureContingency: boolean;
  possession: string | null;
  titleCompany: string;
  quickAbstract: boolean;
}

const money = (n: number | null) => (n ? `$${n.toLocaleString("en-US")}` : "to be confirmed");
const day = (iso: string | null) => (iso ? formatDayMonth(iso) : "To be confirmed");
const monthDay = (iso: string | null) => (iso ? formatDayMonth(iso).replace(/^\w+, /, "") : "to be confirmed");

export const INSPECTORS = [
  "Eagle Home Inspection — (267) 538-2292",
  "Corwin Jackson, Core Inspection Group — (215) 987-7547",
  "East Coast Inspection — (215) 275-9064",
];
const DEFAULT_INSPECTIONS = ["Home inspection", "Termite (wood-destroying insect) inspection", "Sewer line inspection"];
const INSURANCE_AGENTS = [
  "Farmers Insurance — Glenn Hamilton\n2 Bala Plaza, Suite 300, Bala Cynwyd, PA 19004\n(484) 263-2424",
  "Allstate — Jada Thompson\n(215) 730-5764 | jadathompson@allstate.com\nQuick-quote form: https://forms.gle/gL82X6pph2AahFTw7",
];
const DATES_MATTER = "Please keep in mind that all of the dates above are extremely important and are not flexible. Missing any of them could put you in violation of the Agreement of Sale, and you could lose your deposit.";
const CLOSING = [
  "I am here to help you every step of the way, so please do not hesitate to reach out. Thank you for choosing the Buy SMART Team for your real estate needs!",
  "Warm regards,\nClient Care\nThe Buy SMART Team\nRealty ONE Group Focus",
];

/** Loan types in plain words, with no acronyms in client email. */
export function loanTypeWords(type: string | null): string {
  const t = (type ?? "").trim();
  const map: [RegExp, string][] = [
    [/^fha\b|federal housing/i, "Federal Housing Administration"],
    [/^va\b|veteran/i, "Veterans Affairs"],
    [/^usda\b|rural/i, "Department of Agriculture rural housing"],
    [/phfa|housing finance agency/i, "Pennsylvania Housing Finance Agency"],
    [/^conv/i, "conventional"],
  ];
  return map.find(([re]) => re.test(t))?.[1] ?? t;
}

function inspectorsBlock(notifyWord: string): string[] {
  return [
    `If you have any specific concerns about the house, mention them to your inspector. Please send our office the date, time, and name of the inspection company you choose, and we will ${notifyWord}. We encourage you to attend the inspection, which usually takes 2 to 3 hours. Here are some inspectors our clients have worked with:\n\n${INSPECTORS.join("\n")}`,
    "PLEASE NOTE: We have no affiliation with any of these companies. They are, however, strongly recommended and trusted.",
    "If you would like help scheduling your inspections, send me your availability and I will set them up for you.",
  ];
}

function settlementNotice(f: DayOneFacts, company: boolean): string {
  return `About one week before settlement, you will receive a settlement notice from the title company. It will include a list of utility companies to call. Please ask each one to put the utilities in ${company ? "your company's" : "your"} name as of settlement day${f.settlement ? `, ${monthDay(f.settlement)}` : ""}. You do not need to ask the gas or water company to come out for a final reading. We will take the readings at the final walk-through and submit them to the title company at settlement.`;
}

/** Jaz's welcome for a buyer using a lender (her Malcolm St version). */
function mortgageWelcome(f: DayOneFacts, w: WelcomeFacts): string[] {
  const lender = f.lenderName || "your lender";
  const contingent = w.inspectionType === "contingency" && !!w.inspectionDue;
  const keyDates = [
    `• ${day(w.depositDue)} — Earnest money deposit due${w.deposit ? ` (${money(w.deposit)})` : ""}`,
    `• ${day(f.mortgageApplication)} — Complete your mortgage application with your lender`,
    ...(contingent ? [`• ${day(w.inspectionDue)} — Inspection period ends (all inspections must be completed)`] : w.inspectionType === "waived" ? [] : ["• As soon as possible — Schedule and complete your inspections"]),
    ...(contingent && w.negotiationEnd ? [`• ${day(w.negotiationEnd)} — Last day to negotiate repairs or credits with the seller`] : []),
    `• ${day(f.commitment)} — Mortgage commitment due to the seller`,
    `• ${day(f.settlement)} — Settlement (closing day)`,
  ];
  const loan = [w.loanTermYears ? `${w.loanTermYears}-year` : "", loanTypeWords(w.financingType)].filter(Boolean).join(" ");
  const officer = w.loanOfficerName ? ` with your loan officer, ${w.loanOfficerName}` : "";
  const inspectionText = contingent
    ? `Please schedule your inspections right away. Everything must be completed by ${day(w.inspectionDue)}.${w.negotiationEnd ? ` If you want to request repairs or credits based on the results, we will negotiate with the seller between ${monthDay(w.inspectionDue)} and ${monthDay(w.negotiationEnd)}.` : ""} Please keep in mind how time-sensitive these dates are.`
    : w.inspectionType === "informational_only"
      ? "Your agreement states that inspections will be conducted for informational purposes only. That means the inspections are for your knowledge and planning, not for negotiating repairs or credits with the seller. We still strongly recommend getting them done so you know exactly what you are buying. Please schedule them right away."
      : w.inspectionType === "waived"
        ? "Your agreement waives the inspection contingency. You can still have the house inspected for your own information, and we recommend it so you know exactly what you are buying."
        : "Please schedule your inspections right away so you know exactly what you are buying.";
  const chosen = w.inspectionsChosen.length ? w.inspectionsChosen : DEFAULT_INSPECTIONS;
  const titleName = w.quickAbstract ? "our title company, Quick Abstract" : `the title company, ${w.titleCompany}`;
  const depositBy = w.quickAbstract && (w.deposit ?? 0) > 25000 ? "wire" : "wire or cashier's check";

  return [
    `Hi ${w.greetingNames || "there"},`,
    `CONGRATULATIONS! Your offer on ${f.address} was accepted, and a copy of your fully signed Agreement of Sale is attached. The Buy SMART Team will handle transaction coordination for your purchase, and your agent, Jasmine Williams, will be your main point of contact going forward. I will send documents for your review through Dotloop throughout the process, so please reach out anytime with questions.`,
    "There are several deadlines to meet, inspections to schedule, and items to take care of between now and closing. Together, we will make sure everything is handled thoroughly and on time so your homebuying experience is a smooth one. Here is what to expect:",
    `YOUR KEY DATES AT A GLANCE\n${keyDates.join("\n")}`,
    `PURCHASE DETAILS\nPurchase price: ${money(w.price)}${w.sellerCredit ? `\nSeller credit toward your closing costs: ${money(w.sellerCredit)}` : ""}\nEarnest money deposit: ${money(w.deposit)}`,
    `MORTGAGE\nYour loan is a ${loan ? `${loan} loan` : "mortgage"} through ${lender}${officer}. Please complete your full application, including paying for the appraisal and credit report, by ${day(f.mortgageApplication)}. Your mortgage commitment is due by ${day(f.commitment)}. If the seller does not receive it by then, they have the right to cancel the agreement, so please respond quickly to any document requests from the bank.`,
    `INSPECTIONS\n${inspectionText}`,
    `The inspections you chose in your agreement are:\n${chosen.map((x) => `• ${x}`).join("\n")}`,
    `The seller is required to have the heat and all utilities on for your inspections. ${inspectorsBlock("notify the seller")[0]}`,
    ...inspectorsBlock("notify the seller").slice(1),
    ...(w.disclosureContingency
      ? ["SELLER'S DISCLOSURE\nYour offer is contingent on receiving and approving the seller's disclosure statement. As soon as we receive it, I will send it to you through Dotloop for review. Please read it carefully and let Jasmine know if anything concerns you."]
      : []),
    ...(w.possession ? [`POSSESSION\n${w.possession.replace(/\.?$/, ".")} We will confirm this at the final walk-through.`] : []),
    `EARNEST MONEY DEPOSIT\nYour deposit of ${money(w.deposit)} is due by ${day(w.depositDue)}. You will receive a separate email from ${titleName}, with instructions for submitting it by ${depositBy}. Please follow those instructions carefully and reach out if you have any questions. As a reminder, do not send money based on wiring instructions from any email you are not expecting. Always call to confirm first. ${WIRE_LINE}`,
    DATES_MATTER,
    "HOMEOWNERS INSURANCE\nPlease get a homeowners insurance quote right away, and ask about flood insurance as well. Many of our clients find great rates through the company that already handles their car or renters insurance. If you are asked questions about the house that you can't answer, contact me and I will help. We can also recommend an insurance agent:",
    ...INSURANCE_AGENTS,
    `TITLE COMPANY\n${w.quickAbstract ? "We will order your title search and title insurance through Quick Abstract on your behalf unless you tell us otherwise." : `Your title search and title insurance are with ${w.titleCompany}.`}`,
    settlementNotice(f, false),
    "IMPORTANT: Between now and closing, please do not open new credit cards, finance a car or furniture, change jobs, or make large deposits or purchases without talking to your lender first. Any change to your finances can affect your loan approval.",
    ...CLOSING,
  ];
}

/** Jaz's welcome for a cash buyer (her Forrest Ave version). */
function cashWelcome(f: DayOneFacts, w: WelcomeFacts): string[] {
  // Quick Abstract takes no cashier's checks over $25,000.
  const balanceRule = w.quickAbstract
    ? "Your remaining balance must be paid by wire. The title company can't accept a personal check, or a cashier's check over $25,000."
    : "Your remaining balance must be paid by wire or cashier's check, not by personal check.";
  const depositBy = w.quickAbstract && (w.deposit ?? 0) > 25000 ? "wire" : "wire or cashier's check";
  const keyDates = [
    `• ${day(w.depositDue)} — Deposit due${w.deposit ? ` (${money(w.deposit)})` : ""}`,
    ...(w.inspectionType === "waived" ? [] : w.inspectionType === "contingency" && w.inspectionDue
      ? [`• ${day(w.inspectionDue)} — Inspection period ends (all inspections must be completed)`]
      : ["• As soon as possible — Schedule and complete your inspections"]),
    ...(w.inspectionType === "contingency" && w.negotiationEnd ? [`• ${day(w.negotiationEnd)} — Last day to negotiate repairs or credits with the seller`] : []),
    `• ${day(f.settlement)} — Settlement (closing day)`,
  ];
  const inspectionIntro = {
    informational_only: "Your agreement states that inspections will be conducted for informational purposes only. That means the inspections are for your knowledge and planning, not for negotiating repairs or credits with the seller. We still strongly recommend getting them done so you know exactly what you are buying and can plan your renovation budget. Please schedule them right away.",
    contingency: `Please schedule your inspections right away. Everything must be completed by ${day(w.inspectionDue)}.${w.negotiationEnd ? ` If you want to request repairs or credits based on the results, we will negotiate with the seller between ${monthDay(w.inspectionDue)} and ${monthDay(w.negotiationEnd)}.` : ""} Please keep in mind how time-sensitive these dates are.`,
    waived: "Your agreement waives the inspection contingency. You can still have the house inspected for your own information, and we recommend it so you know exactly what you are buying.",
    unknown: "Please schedule your inspections right away so you know exactly what you are buying.",
  }[w.inspectionType];
  const chosen = w.inspectionsChosen.length ? w.inspectionsChosen : DEFAULT_INSPECTIONS;
  const insurance = w.entityName
    ? `Please get an insurance quote right away. Since this property is being purchased by your company, ask for a landlord or dwelling policy in the name of ${w.entityName}, and ask about flood insurance as well.`
    : "Please get a homeowners insurance quote right away, and ask about flood insurance as well.";

  return [
    `Hi ${w.greetingNames || "there"},`,
    `CONGRATULATIONS! Your offer on ${f.address} was accepted, and a copy of the fully signed Agreement of Sale${w.entityName ? ` for ${w.entityName}` : ""} is attached. The Buy SMART Team will handle transaction coordination for your purchase, and Jasmine Williams will be your main point of contact going forward. I will send documents for your review through Dotloop throughout the process, so please reach out anytime with questions.`,
    "There are a few deadlines to meet and items to take care of between now and closing. Together, we will make sure everything is handled thoroughly and on time so your purchase is a smooth one. Here is what to expect:",
    `YOUR KEY DATES AT A GLANCE\n${keyDates.join("\n")}`,
    `PURCHASE DETAILS\nPurchase price: ${money(w.price)}${w.sellerCredit ? `\nSeller credit toward your closing costs: ${money(w.sellerCredit)}` : ""}\nDeposit: ${money(w.deposit)}\nFinancing: Cash purchase (no mortgage)\nSettlement date: ${f.settlement ? formatLong(f.settlement) : "to be confirmed"}`,
    `CASH PURCHASE\nBecause this is a cash purchase, your agreement is not contingent on a mortgage. Please make sure your funds are ready and available to wire well before settlement. The title company will confirm your exact amount due on your settlement statement before closing. ${balanceRule}`,
    `INSPECTIONS\n${inspectionIntro}`,
    `We recommend:\n${chosen.map((x) => `• ${x}`).join("\n")}`,
    ...inspectorsBlock("coordinate access with the seller"),
    ...(w.disclosureContingency
      ? ["SELLER'S DISCLOSURE\nYour offer is contingent on receiving and approving the seller's disclosure statement. As soon as we receive it, I will send it to you through Dotloop for review. Please read it carefully and let Jasmine know if anything concerns you."]
      : []),
    ...(w.possession ? [`POSSESSION\n${w.possession.replace(/\.?$/, ".")} We will confirm this at the final walk-through.`] : []),
    `DEPOSIT\nYour deposit of ${money(w.deposit)} is due by ${day(w.depositDue)}. You will receive separate instructions for submitting it by ${depositBy}. Please follow those instructions carefully and reach out if you have any questions. As a reminder, do not send money based on wiring instructions from any email you are not expecting. Always call to confirm first. ${WIRE_LINE}`,
    DATES_MATTER,
    `PROPERTY INSURANCE\n${insurance} Your policy needs to be in place by settlement. If you are asked questions about the house that you can't answer, contact me and I will help. We can also recommend an insurance agent:`,
    ...INSURANCE_AGENTS,
    `TITLE COMPANY\n${w.quickAbstract ? "We will order your title search and title insurance through Quick Abstract on your behalf unless you tell us otherwise." : `Your title search and title insurance are with ${w.titleCompany}.`}${w.entityName ? ` The title company will also need your company documents (such as your Certificate of Organization and Operating Agreement) to close in the name of ${w.entityName}, so please have those ready to send.` : ""}`,
    settlementNotice(f, !!w.entityName),
    ...CLOSING,
  ];
}

/**
 * The Buy SMART Team's welcome email to a buyer, from Jaz's own templates: one for buyers using a
 * lender, one for cash. Safiya is still copied; she answers whichever deposit request reaches her second.
 */
export function buyerCongrats(f: DayOneFacts, w: WelcomeFacts): EmailDraft {
  return {
    kind: "buyer_congrats",
    to: f.buyerEmails,
    cc: [w.quickAbstract ? QUICK_ABSTRACT.closer : "", ...f.teamCc].filter(Boolean),
    subject: `${f.address} – Your offer was accepted!`,
    body: (w.cash ? cashWelcome(f, w) : mortgageWelcome(f, w)).join("\n\n"),
    attachContract: true,
    reason: "Day one: welcome the buyer with key dates",
  };
}

export interface DepositFacts {
  clientLastName: string;
  greetingNames: string;
  price: number | null;
  deposit: number | null;
  cash: boolean;
  financingType: string | null;
}

/**
 * Jaz's request to the title clerk (Safiya at Quick Abstract) for deposit instructions, copied to the buyer.
 * Based on her Oct 13 Malcolm St email. Safiya asked that the subject never say "wire instructions",
 * because that helps scammers spot the email, so the subject is just the address and last name.
 * Jaz chose to give the buyer title's phone number here, in her own email, in place of WIRE_LINE.
 */
export function depositInstructions(f: DayOneFacts, d: DepositFacts): EmailDraft {
  const lender = d.cash
    ? "Cash purchase (no mortgage)"
    : [f.lenderName || "to follow", loanTypeWords(d.financingType)].filter(Boolean).join(" — ");
  const details = [
    `Property: ${f.address}`,
    `Buyer: ${f.buyerNames}`,
    `Seller: ${f.sellerNames || "to follow"}`,
    `Purchase price: ${money(d.price)}`,
    `Initial deposit: ${money(d.deposit)} (held by ${QUICK_ABSTRACT.name})`,
    `Lender: ${lender}`,
    `Settlement date: ${when(f.settlement)}`,
  ];
  const greet = d.greetingNames || "the buyer";
  return {
    kind: "deposit_instructions",
    to: [QUICK_ABSTRACT.closer, ...f.buyerEmails],
    cc: f.teamCc,
    subject: `${f.address} (${d.clientLastName})`,
    body: `Hi Safiya,\n\nI hope you're doing well! I've placed the title order for my buyer, ${f.buyerNames}${f.buyerEmails.length ? " (cc'd here)" : ""}, and wanted to ask for instructions for the deposit.\n\nHere are the deal details for reference:\n\n${details.map((l) => `- ${l}`).join("\n")}\n\nPlease send the instructions to ${greet} directly at your earliest convenience, and let me know if you need anything else from me to keep the file moving.\n\n${d.greetingNames ? `${d.greetingNames}, when` : "When"} the instructions arrive, please call ${QUICK_ABSTRACT.name} at ${QUICK_ABSTRACT.phone} to confirm them before you send any money. This is a standard step to protect you from wire fraud.${SIGN}`,
    attachContract: false,
    reason: "Day one: ask the title clerk for deposit instructions",
  };
}

export function llcDocuments(f: DayOneFacts, entityName: string): EmailDraft {
  return {
    kind: "llc_documents",
    to: f.buyerEmails,
    cc: [],
    subject: `${f.address} – Documents for ${entityName}`,
    body: `Hi!\n\nSince ${entityName} is buying ${f.address}, the title company will need three documents from you this week:\n\n- The operating agreement, signed by all members\n- The certificate of organization\n- The letter from the IRS with the company's tax ID number\n\nGetting these in now keeps settlement on time. Just reply with them attached.${SIGN}`,
    attachContract: false,
    reason: "LLC buyer: collect entity documents in week one",
  };
}

export function grantReminder(f: DayOneFacts, program: string, packageDue: string | null): EmailDraft {
  return {
    kind: "grant_reminder",
    to: [JAZ_EMAIL],
    cc: [],
    subject: `${f.address} – Grant package due ${packageDue ? formatLong(packageDue) : "(confirm date)"}`,
    body: `Reminder for ${f.address} (${program}): the grant counselor needs every document in one email, 30 days before settlement.\n\nSettlement: ${when(f.settlement)}\nGrant package due: ${when(packageDue)}`,
    attachContract: false,
    reason: "Grant file: reminder for Jaz",
  };
}

/** Buyer side, grant or housing program: ask the counselor what's needed to submit the file. Jaz's wording. */
export function housingAgency(f: DayOneFacts, clients: string[], counselor: { name: string; email: string }): EmailDraft {
  const first = (n: string) => n.trim().split(/\s+/)[0];
  const names = clients.length ? clients : [f.buyerNames];
  const many = names.length > 1;
  const who = names.join(" and ");
  const possessive = many ? names.map(first).join(" and ") + "'s" : `${first(names[0])}'s`;
  return {
    kind: "housing_agency",
    to: [counselor.email],
    cc: [...f.teamCc],
    subject: `${f.address} – ${who} ${many ? "are" : "is"} under contract`,
    body: `Hi ${first(counselor.name) || "there"},\n\nI hope you're doing well! Our mutual client${many ? "s" : ""}, ${who}, ${many ? "are" : "is"} now under contract on ${f.address}, and I wanted to check in on what's needed to get ${possessive} file submitted. Please let me know at your earliest convenience.\n\nTalk soon,\nJasmine`,
    attachContract: false,
    reason: "Day one: check with the housing counselor on what's needed to submit the file",
  };
}

/** Follow-ups from Workflow 3, word for word. Shown on the Templates page. */
/**
 * Rule on every buyer file: when the lender sends the mortgage commitment, Jaz sends it to the listing agent,
 * because the seller must receive it by the contract deadline. Attach only the commitment letter, never the
 * lender's email with the underwriter's conditions (it carries the buyer's personal finances).
 */
export function commitmentToListingAgent(f: {
  address: string; buyerNames: string; agentName: string; agentEmail: string; cc: string[]; settlement: string | null;
}): EmailDraft {
  return {
    kind: "commitment_to_listing_agent",
    to: [f.agentEmail],
    cc: f.cc,
    subject: `${f.address} – Mortgage Commitment`,
    body: `Hi ${f.agentName.split(/[ ,]/)[0] || "there"},\n\nGood news! Attached is ${f.buyerNames}'s mortgage commitment for ${f.address}. We're on track for settlement on ${when(f.settlement)}. Please let me know if your seller needs anything else from our side.${SIGN}`,
    attachContract: false,
    reason: "Mortgage commitment received: deliver it to the listing agent for the seller",
  };
}

export const FOLLOW_UPS: { title: string; to: string; text: string }[] = [
  { title: "Lender, early", to: "Loan officer", text: "Has the application been completed, and has the appraisal been ordered? If the appraisal is scheduled, please let me know the date." },
  { title: "Title, deposit", to: "Title", text: "Please let us know when the deposit is received." },
  { title: "Buyer, deposit wire", to: "Buyer", text: `Kindly forward the bank's wire confirmation for your deposit once available. ${WIRE_LINE}` },
  { title: "Lender, late", to: "Loan officer", text: "Do we have an expected date on the mortgage commitment? Is anything outstanding for clear to close?" },
  { title: "Lender, 3 days out", to: "Loan officer", text: "Please make sure the closing disclosure is signed at least three business days before settlement." },
  { title: "Closing day", to: "Title", text: "Happy closing day! Once closing is complete, may we have a copy of the final signed documents?" },
];
