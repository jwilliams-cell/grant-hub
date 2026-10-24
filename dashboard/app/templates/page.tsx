import { CopyButton } from "@/components/CopyButton";
import { agentTimeline, buyerCongrats, FOLLOW_UPS, lenderIntro, llcDocuments, titleOrder, type DayOneFacts } from "@/lib/templates";

export const metadata = { title: "Templates · BuySmart Transaction Desk" };

// Placeholders in brackets, filled in for real on each file by the New contract page.
const SAMPLE: DayOneFacts = {
  address: "[Address]",
  buyerNames: "[Buyer]",
  buyerEmails: ["[buyer email]"],
  sellerNames: "[Seller]",
  coopAgentName: "[Agent name, brokerage]",
  coopAgentEmail: "[agent email]",
  lenderName: "[Lender]",
  loanOfficerEmail: "[loan officer email]",
  processorEmail: "[processor email]",
  dates: ["Execution date", "Deposit due", "Mortgage application due", "Reply to inspection due", "Mortgage commitment", "Settlement"].map((label) => ({ label, date: null })),
  executionDate: null,
  mortgageApplication: null,
  commitment: null,
  settlement: null,
};

export default function TemplatesPage() {
  const dayOne = [titleOrder(SAMPLE), lenderIntro(SAMPLE), agentTimeline(SAMPLE), buyerCongrats(SAMPLE), llcDocuments(SAMPLE, "[LLC name]")];
  return (
    <div className="stack">
      <div className="section">
        <h1>Templates</h1>
        <p className="muted prose">The day-one emails go out as drafts automatically when you add a contract. The follow-ups are Sarah's exact words.</p>
      </div>
      <section className="section">
        <h2>Day one</h2>
        <div className="grid-wide">
          {dayOne.map((t) => {
            const full = `Subject: ${t.subject}\n\n${t.body}`;
            return (
              <div key={t.kind} className="card stack-sm">
                <div className="card-head" style={{ marginBottom: 0 }}>
                  <h3>{t.subject}</h3>
                  <CopyButton text={full} />
                </div>
                <div className="ui subtle">To {[...t.to, ...t.cc].join(", ")}{t.attachContract ? " · attach the Agreement of Sale" : ""}</div>
                <pre className="template">{t.body}</pre>
              </div>
            );
          })}
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
