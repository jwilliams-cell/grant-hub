// Sarah Cadman's day-one emails and follow-ups (transaction-coordinator.md), in Jaz's voice.
// Plain language, no acronyms, signed "Jasmine". Every buyer email about money carries WIRE_LINE.

import { formatLong } from "./dates.ts";

export const JAZ_EMAIL = "jwilliams@gremom.com";
export const WIRE_LINE =
  "Before you send any money, call the title company at a number you found yourself to confirm the instructions.";
export const QUICK_ABSTRACT = {
  name: "Quick Abstract",
  orders: "titleorders@quickabstract.com",
  closer: "smartin@quickabstract.com",
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
  lenderName: string;
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
    cc: [QUICK_ABSTRACT.closer],
    subject: `${f.address} – Title Order`,
    body: `Hello!\n\nAttached is the signed Agreement of Sale for a new title order for our buyer.\n\nAgent: Jasmine Williams — ${JAZ_EMAIL}\nBuyer: ${f.buyerNames} — ${f.buyerEmails.join(", ") || "email to follow"}\nCooperating agent: ${f.coopAgentName || "to follow"} — ${f.coopAgentEmail || "email to follow"}\nSeller: ${f.sellerNames || "to follow"}\nLender: ${f.lenderName || "to follow"} — ${f.loanOfficerEmail || "email to follow"}\n\nPlease cc me on all communication.${SIGN}`,
    attachContract: true,
    reason: "Day one: order title",
  };
}

export function lenderIntro(f: DayOneFacts): EmailDraft {
  return {
    kind: "lender_intro",
    to: [f.loanOfficerEmail].filter(Boolean),
    cc: [f.processorEmail].filter(Boolean),
    subject: `${f.address} (${f.buyerNames}) is under contract`,
    body: `Hi!\n\n${f.buyerNames} is officially under contract on ${f.address}; the signed Agreement of Sale is attached.\n\n- Mortgage application: ${when(f.mortgageApplication)}\n- Commitment: ${when(f.commitment)}\n- Settlement: ${when(f.settlement)}\n\nTitle is with Quick Abstract. Please keep me copied and let me know once the application is complete and the appraisal is ordered.${SIGN}`,
    attachContract: true,
    reason: "Day one: introduce the file to the lender",
  };
}

export function agentTimeline(f: DayOneFacts): EmailDraft {
  return {
    kind: "agent_timeline",
    to: [f.coopAgentEmail].filter(Boolean),
    cc: [],
    subject: `${f.address} – Key dates`,
    body: `Hi ${f.coopAgentName.split(/[ ,]/)[0] || "there"},\n\nLooking forward to a smooth one together. Here are the key dates. Please confirm or let me know of any discrepancies:\n\n${list(f.dates)}\n\nLender: ${f.lenderName || "to follow"}\nTitle: Quick Abstract — ${QUICK_ABSTRACT.orders}\n\nPlease copy me on all correspondence.${SIGN}`,
    attachContract: false,
    reason: "Day one: key dates to the other agent",
  };
}

export function buyerCongrats(f: DayOneFacts): EmailDraft {
  return {
    kind: "buyer_congrats",
    to: f.buyerEmails,
    cc: [QUICK_ABSTRACT.closer],
    subject: `${f.address} – You're under contract!`,
    body: `Congratulations!\n\nYour Agreement of Sale is attached. Here are the dates to keep in mind:\n\n${list(f.dates)}\n\nI've copied the title company so they can send wiring instructions for your deposit. ${WIRE_LINE}\n\nPlease reply all so everyone stays in the loop.\n\nSo happy for you!\nJasmine`,
    attachContract: true,
    reason: "Day one: congratulate the buyer; title sends deposit wiring instructions",
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

/** Follow-ups from Workflow 3, word for word. Shown on the Templates page. */
export const FOLLOW_UPS: { title: string; to: string; text: string }[] = [
  { title: "Lender, early", to: "Loan officer", text: "Has the application been completed, and has the appraisal been ordered? If the appraisal is scheduled, please let me know the date." },
  { title: "Title, deposit", to: "Title", text: "Please let us know when the deposit is received." },
  { title: "Buyer, deposit wire", to: "Buyer", text: `Kindly forward the bank's wire confirmation for your deposit once available. ${WIRE_LINE}` },
  { title: "Lender, late", to: "Loan officer", text: "Do we have an expected date on the mortgage commitment? Is anything outstanding for clear to close?" },
  { title: "Lender, 3 days out", to: "Loan officer", text: "Please make sure the closing disclosure is signed at least three business days before settlement." },
  { title: "Closing day", to: "Title", text: "Happy closing day! Once closing is complete, may we have a copy of the final signed documents?" },
];
