import { CopyButton } from "@/components/CopyButton";
import { agentTimeline, buyerCongrats, commitmentToListingAgent, depositInstructions, FOLLOW_UPS, housingAgency, lenderIntro, llcDocuments, titleOrder, type DayOneFacts, type EmailDraft, type WelcomeFacts } from "@/lib/templates";

export const metadata = { title: "Templates · BuySmart Transaction Desk" };

// Placeholders in brackets, filled in for real on each file by the New contract page.
const SAMPLE: DayOneFacts = {
  address: "[Address]",
  buyerNames: "[Buyer]",
  buyerEmails: ["[buyer email]"],
  sellerNames: "[Seller]",
  coopAgentName: "[Agent name, brokerage]",
  coopAgentEmail: "[agent email]",
  loanOfficerName: "[Loan officer]",
  coAgentName: "",
  coAgentEmail: "",
  teamCc: [],
  otherSideCc: ["[seller side coordinator email]"],
  lenderName: "[Lender]",
  loanOfficerEmail: "[loan officer email]",
  processorEmail: "[processor email]",
  dates: ["Execution date", "Deposit due", "Mortgage application due", "Reply to inspection due", "Mortgage commitment", "Settlement"].map((label) => ({ label, date: null })),
  executionDate: null,
  mortgageApplication: null,
  commitment: null,
  settlement: null,
};

// The buyer welcome email changes with the deal; show the two most common versions.
const WELCOME_CASH_LLC: WelcomeFacts = {
  greetingNames: "[Buyer first name]", entityName: "[Company name]", price: null, deposit: null, depositDue: null, cash: true,
  financingType: null, loanTermYears: null, loanOfficerName: "", sellerCredit: null,
  inspectionType: "informational_only", inspectionDue: null, negotiationEnd: null, inspectionsChosen: [],
  disclosureContingency: false, possession: "[How the property is delivered]",
  titleCompany: "Quick Abstract", quickAbstract: true,
};
const WELCOME_MORTGAGE: WelcomeFacts = {
  ...WELCOME_CASH_LLC, entityName: null, cash: false, financingType: "FHA", loanTermYears: 30, loanOfficerName: "[Loan officer]",
  inspectionType: "contingency", inspectionDue: "[inspection end date]", negotiationEnd: "[negotiation end date]",
  disclosureContingency: true, possession: null,
};

function templateCard(t: EmailDraft) {
  const full = `Subject: ${t.subject}\n\n${t.body}`;
  return (
    <div key={t.kind + t.body.length} className="card stack-sm">
      <div className="card-head" style={{ marginBottom: 0 }}>
        <h3>{t.subject}</h3>
        <CopyButton text={full} />
      </div>
      <div className="ui subtle">To {[...t.to, ...t.cc].join(", ")}{t.attachContract ? " · attach the Agreement of Sale" : ""}{t.kind === "commitment_to_listing_agent" ? " · attach the commitment letter only" : ""}</div>
      <pre className="template">{t.body}</pre>
    </div>
  );
}

export default function TemplatesPage() {
  const dayOne = [
    titleOrder(SAMPLE),
    depositInstructions(SAMPLE, { clientLastName: "[Client last name]", greetingNames: "[Buyer first name]", price: null, deposit: null, cash: false, financingType: "FHA" }),
    lenderIntro(SAMPLE), agentTimeline(SAMPLE),
    buyerCongrats(SAMPLE, WELCOME_CASH_LLC), buyerCongrats(SAMPLE, WELCOME_MORTGAGE),
    llcDocuments(SAMPLE, "[LLC name]"), housingAgency(SAMPLE, ["[Buyer]"], { name: "[Counselor]", email: "[counselor email]" }),
  ];
  const inFile = [
    commitmentToListingAgent({ address: "[Address]", buyerNames: "[Buyer]", agentName: "[Listing agent]", agentEmail: "[agent email]", cc: ["[seller side coordinator email]"], settlement: null }),
  ];
  return (
    <div className="stack">
      <div className="section">
        <h1>Templates</h1>
        <p className="muted prose">The day-one emails go out as drafts automatically when you add a contract. The others are drafted when the matching document arrives. The follow-ups are Sarah's exact words.</p>
      </div>
      <section className="section">
        <h2>Day one</h2>
        <div className="grid-wide">
          {dayOne.map(templateCard)}
        </div>
      </section>
      <section className="section">
        <h2>When documents come in</h2>
        <div className="grid-wide">
          {inFile.map(templateCard)}
        </div>
      </section>
      <section className="section">
        <h2>Follow-ups</h2>
        <div className="grid-wide">
          {FOLLOW_UPS.map((f) => (
            <div key={f.title} className="card stack-sm">
              <div className="card-head" style={{ marginBottom: 0 }}>
                <h3>{f.title}</h3>
                <CopyButton text={f.text} />
              </div>
              <div className="ui subtle">To {f.to}</div>
              <pre className="template">{f.text}</pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
