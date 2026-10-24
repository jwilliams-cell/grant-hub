import Link from "next/link";
import { toneFor, type StageState, type Stage } from "@/lib/view";
import { formatShort } from "@/lib/dates";
import type { Deal, Milestone } from "@/lib/types";

export function Tag({ status }: { status: string }) {
  if (!status) return null;
  return <span className={`tag tone-${toneFor(status)}`}>{status}</span>;
}

export function Stepper({ steps }: { steps: { stage: Stage; state: StageState }[] }) {
  return (
    <ol className="stepper" aria-label="Progress">
      {steps.map((s) => (
        <li key={s.stage} className={s.state} aria-current={s.state === "current" ? "step" : undefined}>
          <span className="bar" />
          <span className="name">{s.stage}</span>
        </li>
      ))}
    </ol>
  );
}

export function MilestoneList({ items, empty }: { items: { deal: Deal; m: Milestone }[]; empty: string }) {
  if (!items.length) return <p className="subtle ui">{empty}</p>;
  return (
    <ul className="list">
      {items.map(({ deal, m }) => (
        <li key={`${m.deal_id}-${m.seq}`}>
          <span>
            <Link href={`/files/${deal.deal_id}`}>{deal.address}</Link> · {m.step}
            <br />
            <span className="meta">{m.owner}{m.due ? ` · due ${formatShort(m.due)}` : ""}</span>
          </span>
          <Tag status={m.status} />
        </li>
      ))}
    </ul>
  );
}

export function SetupNeeded({ error }: { error: string }) {
  return (
    <div className="card stack-sm">
      <h2>The tracker Sheet isn't connected yet</h2>
      <p className="muted">The dashboard reads the BuySmart TC Tracker Sheet. Fill in the Google settings in <code>dashboard/.env</code> (see <code>.env.example</code> and the README), then reload.</p>
      <p className="error-text">{error}</p>
    </div>
  );
}
