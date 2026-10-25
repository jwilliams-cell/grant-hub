import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTracker } from "@/lib/load";
import { isLate, stepper } from "@/lib/view";
import { formatLong, formatShort, todayET } from "@/lib/dates";
import { driveFileUrl, driveFolderUrl, gmailSearchUrl } from "@/lib/google";
import { SetupNeeded, Stepper, Tag } from "@/components/bits";
import { PEOPLE_FIELDS, type PeopleField } from "@/lib/people";
import { EditPeople } from "./EditPeople";

export default async function FileDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadTracker();
  if (!loaded.ok) return <SetupNeeded error={loaded.error} />;
  const t = loaded.tracker;
  const deal = t.deals.find((d) => d.deal_id === id);
  if (!deal) notFound();

  const today = todayET();
  const ms = t.milestones.filter((m) => m.deal_id === id).sort((a, b) => Number(a.seq) - Number(b.seq));
  const docs = t.documents.filter((d) => d.deal_id === id);
  const activity = t.activity.filter((a) => a.deal_id === id).sort((a, b) => b.at.localeCompare(a.at));
  const street = deal.address.replace(/\s+(St|Ave|Rd|Dr|Ln|Ter)\.?$/i, "");
  const gmailQuery = [`"${street}"`, deal.title_file_no].filter(Boolean).join(" OR ");

  const people = [
    { role: "Client", name: deal.client, email: deal.client_email },
    { role: deal.side === "Listing" ? "Buyer's agent" : "Listing agent", name: deal.other_agent, email: deal.other_agent_email },
    { role: "Co-op transaction coordinator", name: deal.coop_tc, email: deal.coop_tc_email },
    { role: "Housing counselor", name: deal.housing_counselor, email: deal.housing_counselor_email },
    { role: "Savings counselor", name: deal.savings_counselor, email: deal.savings_counselor_email },
    { role: deal.side === "Listing" ? "Second buyer's agent" : "Co-agent (buyer side)", name: deal.buyer_agent_2, email: deal.buyer_agent_2_email },
    { role: deal.lender ? `Loan officer, ${deal.lender}` : "Loan officer", name: deal.loan_officer || deal.lender, email: deal.loan_officer_email },
    { role: "Processor", name: "", email: deal.processor_email },
    { role: "Title", name: [deal.title_co, deal.title_file_no].filter(Boolean).join(" · "), email: "" },
    { role: "Housing program", name: deal.grant_program, email: "" },
  ].filter((p) => p.name || p.email);

  return (
    <div className="stack">
      <div className="section">
        <nav className="ui subtle"><Link href="/files">Files</Link> / {deal.address}</nav>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>{deal.address}</h1>
          <Tag status={deal.status} />
        </div>
        <p className="ui muted">
          {deal.client} · {deal.side}
          {deal.financing ? ` · ${deal.financing}` : ""}
          {deal.price ? ` · ${deal.price}` : ""}
          {deal.settlement_date ? ` · settles ${formatLong(deal.settlement_date)}${deal.settlement_time ? ` at ${deal.settlement_time}` : ""}` : ""}
        </p>
        <Stepper steps={stepper(deal, ms)} />
        <div className="row">
          {deal.drive_folder_id && (
            <a className="btn btn-secondary" href={driveFolderUrl(deal.drive_folder_id)} target="_blank" rel="noreferrer">Open Drive folder</a>
          )}
          <a className="btn btn-ghost" href={gmailSearchUrl(gmailQuery)} target="_blank" rel="noreferrer">Open in Gmail</a>
        </div>
        {deal.notes && <p className="muted">{deal.notes}</p>}
      </div>

      <section className="card">
        <div className="card-head"><h3>Milestones</h3><span className="label">{ms.filter((m) => m.status === "Done").length} of {ms.length} done</span></div>
        {ms.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Step</th><th>Due</th><th>Status</th><th>Owner</th><th>Note</th></tr></thead>
              <tbody>
                {ms.map((m) => (
                  <tr key={m.seq}>
                    <td>{m.source_link ? <a href={m.source_link} target="_blank" rel="noreferrer">{m.step}</a> : m.step}</td>
                    <td className="nowrap">{m.due ? formatShort(m.due) : "—"}<br /><span className="subtle">{m.date_type}</span></td>
                    <td><Tag status={isLate(m, today) && m.status !== "Late" ? "Late" : m.status} /></td>
                    <td>{m.owner}</td>
                    <td className="subtle">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="subtle ui">No milestones yet.</p>}
      </section>

      <div className="grid-wide">
        <section className="card">
          <div className="card-head"><h3>Documents</h3><span className="label">{docs.length}</span></div>
          {docs.length ? (
            <ul className="list">
              {docs.map((d) => (
                <li key={d.drive_file_id || d.filename}>
                  <span>
                    {d.drive_file_id ? <a href={driveFileUrl(d.drive_file_id)} target="_blank" rel="noreferrer">{d.filename}</a> : d.filename}
                    <br /><span className="meta">{d.drive_subfolder} · from {d.received_from}</span>
                  </span>
                  <span className={`tag tone-${d.skyslope_sent_at ? "success" : "neutral"}`}>{d.skyslope_sent_at ? "In SkySlope" : "Not in SkySlope"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="subtle ui">No documents filed yet.</p>}
          <p className="helper" style={{ marginTop: 12 }}>
            SkySlope address: {deal.skyslope_email && deal.skyslope_email !== "Confirm" ? deal.skyslope_email : <span className="tone-warning">Confirm</span>}
          </p>
        </section>

        <section className="card stack-sm">
          <div className="card-head" style={{ marginBottom: 0 }}><h3>People on the file</h3></div>
          <EditPeople dealId={deal.deal_id} initial={Object.fromEntries(PEOPLE_FIELDS.map((f) => [f.key, deal[f.key] ?? ""])) as Record<PeopleField, string>} />
          <ul className="list">
            {people.map((p) => (
              <li key={p.role}>
                <span>{p.name || "—"}<br /><span className="meta">{p.role}</span></span>
                {p.email && (
                  <span className="stack-sm" style={{ gap: 4, alignItems: "flex-end" }}>
                    {p.email.split(/,\s*/).map((e) => <a key={e} href={`mailto:${e}`}>{e}</a>)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h3>Activity</h3></div>
        {activity.length ? (
          <ul className="list">
            {activity.map((a, i) => (
              <li key={i}>
                <span>
                  {a.event}
                  <br /><span className="meta">{a.detail}</span>
                </span>
                <span className="meta" style={{ textAlign: "right" }}>
                  {a.at} · {a.by}
                  {a.source_link && <><br /><a href={a.source_link} target="_blank" rel="noreferrer">Source</a></>}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="subtle ui">No activity logged for this file yet.</p>}
      </section>
    </div>
  );
}
