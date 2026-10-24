import Link from "next/link";
import { loadTracker } from "@/lib/load";
import { todayView } from "@/lib/view";
import { formatLong, todayET } from "@/lib/dates";
import { gmailDraftUrl } from "@/lib/google";
import { MilestoneList, SetupNeeded, Tag } from "@/components/bits";

export default async function TodayPage() {
  const loaded = await loadTracker();
  if (!loaded.ok) return <SetupNeeded error={loaded.error} />;
  const t = loaded.tracker;
  const today = todayET();
  const v = todayView(t, today);
  const byId = new Map(t.deals.map((d) => [d.deal_id, d]));

  const stats = [
    { label: "Days to next settlement", value: v.nextSettlement ? String(v.nextSettlement.days) : "—" },
    { label: "Open items", value: String(v.openItems) },
    { label: "Waiting on others", value: String(v.waitingOnOthers) },
    { label: "Active files", value: String(v.activeCount) },
  ];

  return (
    <div className="stack">
      <section className="band" aria-labelledby="next-settlement">
        <span className="label">{formatLong(today)}</span>
        {v.nextSettlement ? (
          <>
            <h1 id="next-settlement">
              {v.nextSettlement.deal.address} settles in {v.nextSettlement.days} {v.nextSettlement.days === 1 ? "day" : "days"}
            </h1>
            <p className="ui">
              {v.nextSettlement.deal.client} · {formatLong(v.nextSettlement.deal.settlement_date)}
              {v.nextSettlement.deal.settlement_time ? ` at ${v.nextSettlement.deal.settlement_time}` : ""}
            </p>
          </>
        ) : (
          <h1 id="next-settlement">No settlement on the calendar</h1>
        )}
      </section>

      <section className="grid" aria-label="Summary">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="label">{s.label}</div>
            <div className="big-number">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="grid-wide">
        <div className="card">
          <div className="card-head"><h3>Late</h3><span className="label">{v.late.length}</span></div>
          <MilestoneList items={v.late} empty="Nothing is late." />
        </div>
        <div className="card">
          <div className="card-head"><h3>Due in 2 days</h3><span className="label">{v.dueSoon.length}</span></div>
          <MilestoneList items={v.dueSoon} empty="Nothing due in the next two days." />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Drafts waiting in Gmail</h3><span className="label">{v.draftsWaiting.length}</span></div>
        {v.draftsWaiting.length ? (
          <ul className="list">
            {v.draftsWaiting.map((d) => (
              <li key={d.gmail_draft_id || d.subject}>
                <span>
                  {d.subject}
                  <br />
                  <span className="meta">
                    To {d.to}
                    {byId.get(d.deal_id) ? <> · <Link href={`/files/${d.deal_id}`}>{byId.get(d.deal_id)!.address}</Link></> : null}
                  </span>
                </span>
                <span className="row">
                  <Tag status={d.status} />
                  <a className="btn btn-ghost btn-small" href={d.gmail_message_id ? gmailDraftUrl(d.gmail_message_id) : "https://mail.google.com/mail/u/0/#drafts"} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="subtle ui">No drafts waiting.</p>
        )}
      </section>
    </div>
  );
}
