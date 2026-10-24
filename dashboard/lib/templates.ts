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
  /** Extra people on the other side to copy on the key dates email: their second agent or their coordinator. */
  otherSideCc: string[];
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
    cc: [QUICK_ABSTRACT.closer, f.coAgentEmail].filter(Boolean),
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
    cc: [f.processorEmail, f.coAgentEmail].filter(Boolean),
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
    cc: [...f.otherSideCc, f.coAgentEmail].filter(Boolean),
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
  inspectionType: InspectionType;
  inspectionDue: string | null;
  possession: string | null;
  titleCompany: string;
  quickAbstract: boolean;
}

const money = (n: number | null) => (n ? `$${n.toLocaleString("en-US")}` : "to be confirmed");
const day = (iso: string | null) => (iso ? formatDayMonth(iso) : "To be confirmed");

export const INSPECTORS = [
  "Eagle Home Inspection — (267) 538-2292",
  "Corwin Jackson, Core Inspection Group — (215) 987-7547",
  "East Coast Inspection — (215) 275-9064",
];

/**
 * The Buy SMART Team's welcome email to a buyer, from Jaz's own template. Sections change with
 * the deal: cash or mortgage, inspection terms, company or person buying, possession, title company.
 * Title is copied so they send deposit instructions.
 */
export function buyerCongrats(f: DayOneFacts, w: WelcomeFacts): EmailDraft {
  const lender = f.lenderName || "your lender";
  // Quick Abstract takes no cashier's checks over $25,000.
  const balanceRule = w.quickAbstract
    ? "Your remaining balance must be paid by wire. The title company can't accept a personal check, or a cashier's check over $25,000."
    : "Your remaining balance must be paid by wire or cashier's check, not by personal check.";
  const depositBy = w.quickAbstract && (w.deposit ?? 0) > 25000 ? "wire" : "wire or cashier's check";

  const keyDates = [
    `• ${day(w.depositDue)} — Deposit due${w.deposit ? ` (${money(w.deposit)})` : ""}`,
    ...(w.cash ? [] : [`• ${day(f.mortgageApplication)} — Mortgage application due`]),
    ...(w.inspectionType === "waived" ? [] : w.inspectionType === "contingency" && w.inspectionDue
      ? [`• ${day(w.inspectionDue)} — Inspections done and your reply to the seller due`]
      : ["• As soon as possible — Schedule and complete your inspections"]),
    ...(w.cash ? [] : [`• ${day(f.commitment)} — Mortgage commitment due`]),
    `• ${day(f.settlement)} — Settlement (closing day)`,
  ];

  const financing = w.cash
    ? "Cash purchase (no mortgage)"
    : `${w.financingType ? `${w.financingType} mortgage` : "Mortgage"}${f.lenderName ? ` with ${f.lenderName}` : ""}`;

  const fundsSection = w.cash
    ? `CASH PURCHASE\nBecause this is a cash purchase, your agreement is not contingent on a mortgage. Please make sure your funds are ready and available to wire well before settlement. The title company will confirm your exact amount due on your settlement statement before closing. ${balanceRule}`
    : `YOUR MORTGAGE\nPlease complete your mortgage application with ${lender} by ${day(f.mortgageApplication)} and send them anything they ask for right away. Your mortgage commitment is due by ${day(f.commitment)}. Until settlement, please talk to your lender before opening new credit, changing jobs, or making large purchases or deposits. The title company will confirm your exact amount due on your settlement statement before closing. ${balanceRule}`;

  const inspectionIntro = {
    informational_only: "Your agreement states that inspections will be conducted for informational purposes only. That means the inspections are for your knowledge and planning, not for negotiating repairs or credits with the seller. We still strongly recommend getting them done so you know exactly what you are buying and can plan your renovation budget. Please schedule them right away.",
    contingency: `Your agreement gives you until ${day(w.inspectionDue)} to complete your inspections and respond to the seller. Please schedule them right away so we have time to review the reports together before that deadline.`,
    waived: "Your agreement waives the inspection contingency. You can still have the house inspected for your own information, and we recommend it so you know exactly what you are buying.",
    unknown: "Please schedule your inspections right away so you know exactly what you are buying.",
  }[w.inspectionType];

  const insurance = w.entityName
    ? `Please get an insurance quote right away. Since this property is being purchased by your company, ask for a landlord or dwelling policy in the name of ${w.entityName}, and ask about flood insurance as well.`
    : "Please get a homeowners insurance quote right away, and ask about flood insurance as well.";

  const title = w.quickAbstract
    ? "We will order your title search and title insurance through Quick Abstract on your behalf unless you tell us otherwise."
    : `Your title search and title insurance are with ${w.titleCompany}.`;

  const body = [
    `Hi ${w.greetingNames || "there"},`,
    `CONGRATULATIONS! Your offer on ${f.address} was accepted, and a copy of the fully signed Agreement of Sale${w.entityName ? ` for ${w.entityName}` : ""} is attached. The Buy SMART Team will handle transaction coordination for your purchase, and Jasmine Williams will be your main point of contact going forward. I will send documents for your review through Dotloop throughout the process, so please reach out anytime with questions.`,
    "There are a few deadlines to meet and items to take care of between now and closing. Together, we will make sure everything is handled thoroughly and on time so your purchase is a smooth one. Here is what to expect:",
    `YOUR KEY DATES AT A GLANCE\n${keyDates.join("\n")}`,
    `PURCHASE DETAILS\nPurchase price: ${money(w.price)}\nDeposit: ${money(w.deposit)}\nFinancing: ${financing}\nSettlement date: ${f.settlement ? formatLong(f.settlement) : "to be confirmed"}`,
    fundsSection,
    `INSPECTIONS\n${inspectionIntro}`,
    "We recommend:\n• Home inspection\n• Termite (wood-destroying insect) inspection\n• Sewer line inspection",
    `If you have any specific concerns about the house, mention them to your inspector. Please send our office the date, time, and name of the inspection company you choose, and we will coordinate access with the seller. We encourage you to attend the inspection, which usually takes 2 to 3 hours. Here are some inspectors our clients have worked with:\n\n${INSPECTORS.join("\n")}`,
    "PLEASE NOTE: We have no affiliation with any of these companies. They are, however, strongly recommended and trusted.",
    "If you would like help scheduling your inspections, send me your availability and I will set them up for you.",
    ...(w.possession ? [`POSSESSION\n${w.possession.replace(/\.?$/, ".")} We will confirm this at the final walk-through.`] : []),
    `DEPOSIT\nYour deposit of ${money(w.deposit)} is due by ${day(w.depositDue)}. You will receive separate instructions for submitting it by ${depositBy}. Please follow those instructions carefully and reach out if you have any questions. As a reminder, do not send money based on wiring instructions from any email you are not expecting. ${WIRE_LINE}`,
    "Please keep in mind that all of the dates above are extremely important and are not flexible. Missing any of them could put you in violation of the Agreement of Sale, and you could lose your deposit.",
    `PROPERTY INSURANCE\n${insurance} Your policy needs to be in place by settlement.${w.cash ? "" : " Your lender will need proof of the policy before closing."} If you are asked questions about the house that you can't answer, contact me and I will help. We can also recommend an insurance agent:`,
    "Farmers Insurance — Glenn Hamilton\n2 Bala Plaza, Suite 300, Bala Cynwyd, PA 19004\n(484) 263-2424",
    "Allstate — Jada Thompson\n(215) 730-5764 | jadathompson@allstate.com\nQuick-quote form: https://forms.gle/gL82X6pph2AahFTw7",
    `TITLE COMPANY\n${title}${w.entityName ? ` The title company will also need your company documents (such as your Certificate of Organization and Operating Agreement) to close in the name of ${w.entityName}, so please have those ready to send.` : ""}`,
    `About one week before settlement, you will receive a settlement notice from the title company. It will include a list of utility companies to call. Please ask each one to put the utilities in ${w.entityName ? "your company's" : "your"} name as of settlement day${f.settlement ? `, ${formatDayMonth(f.settlement).replace(/^\w+, /, "")}` : ""}. You do not need to ask the gas or water company to come out for a final reading. We will take the readings at the final walk-through and submit them to the title company at settlement.`,
    "I am here to help you every step of the way, so please do not hesitate to reach out. Thank you for choosing the Buy SMART Team for your real estate needs!",
    "Warm regards,\nClient Care\nThe Buy SMART Team\nRealty ONE Group Focus",
  ].join("\n\n");

  return {
    kind: "buyer_congrats",
    to: f.buyerEmails,
    cc: [w.quickAbstract ? QUICK_ABSTRACT.closer : "", f.coAgentEmail].filter(Boolean),
    subject: `${f.address} – Your offer was accepted!`,
    body,
    attachContract: true,
    reason: "Day one: welcome the buyer with key dates; title sends deposit instructions",
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
    cc: f.coAgentEmail ? [f.coAgentEmail] : [],
    subject: `${f.address} – ${who} ${many ? "are" : "is"} under contract`,
    body: `Hi ${first(counselor.name) || "there"},\n\nI hope you're doing well! Our mutual client${many ? "s" : ""}, ${who}, ${many ? "are" : "is"} now under contract on ${f.address}, and I wanted to check in on what's needed to get ${possessive} file submitted. Please let me know at your earliest convenience.\n\nTalk soon,\nJasmine`,
    attachContract: false,
    reason: "Day one: check with the housing counselor on what's needed to submit the file",
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
