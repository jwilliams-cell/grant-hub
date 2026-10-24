import Link from "next/link";
import { loadTracker } from "@/lib/load";
import { nextStep, stepper } from "@/lib/view";
import { formatShort } from "@/lib/dates";
import { SetupNeeded, Stepper, Tag } from "@/components/bits";

const FILTERS = ["Active", "Closed", "Terminated"] as const;

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = FILTERS.find((f) => f === raw) ?? "Active";
  const loaded = await loadTracker();
  if (!loaded.ok) return <SetupNeeded error={loaded.error} />;
  const t = loaded.tracker;
  const deals = t.deals
    .filter((d) => d.status === status)
    .sort((a, b) => (status === "Active" ? (a.settlement_date || "9999").localeCompare(b.settlement_date || "9999") : b.settlement_date.localeCompare(a.settlement_date)));

  return (
    <div className="stack">
      <div className="section">
        <h1>Files</h1>
        <nav className="tabs" aria-label="Filter files">
          {FILTERS.map((f) => (
            <Link key={f} href={`/files?status=${f}`} aria-current={f === status ? "page" : undefined}>
              {f} ({t.deals.filter((d) => d.status === f).length})
            </Link>
          ))}
        </nav>
      </div>
      {deals.length === 0 && <p className="subtle ui">No {status.toLowerCase()} files.</p>}
      <div className="grid-wide">
        {deals.map((deal) => {
          const ms = t.milestones.filter((m) => m.deal_id === deal.deal_id).sort((a, b) => Number(a.seq) - Number(b.seq));
          const next = deal.status === "Active" ? nextStep(ms) : undefined;
          return (
            <Link key={deal.deal_id} href={`/files/${deal.deal_id}`} className="card card-link stack-sm" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card-head" style={{ marginBottom: 0 }}>
                <h3>{deal.address}</h3>
                <Tag status={deal.status} />
              </div>
              <div className="ui muted">
                {deal.client} · {deal.side}
                {deal.settlement_date ? ` · settles ${formatShort(deal.settlement_date)}` : " · settlement to confirm"}
              </div>
              <Stepper steps={stepper(deal, ms)} />
              {next && (
                <div className="ui">
                  <span className="label">Next step</span>
                  <br />
                  {next.step}
                  {next.due ? <span className="subtle"> · {formatShort(next.due)}</span> : null}
                </div>
              )}
              {!ms.length && deal.status === "Active" && <div className="ui subtle">{deal.notes || "No milestones yet."}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
