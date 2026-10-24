"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { uploadPresigned } from "@vercel/blob/client";
import { createFile, readContract } from "./actions";
import { DATE_KEYS, DATE_LABELS, resolveDates, type Contract, type PersonValue } from "@/lib/contract";
import { buildPlan } from "@/lib/plan";
import { formatShort } from "@/lib/dates";
import type { IntakeResult } from "@/lib/intake";

type Step = "upload" | "review" | "done";

// Update one value deep inside the contract without mutating it.
function setIn<T>(obj: T, path: (string | number)[], value: unknown): T {
  const copy = structuredClone(obj) as Record<string | number, unknown>;
  let cur = copy;
  for (const key of path.slice(0, -1)) {
    if (cur[key] == null) cur[key] = {};
    cur = cur[key] as Record<string | number, unknown>;
  }
  cur[path.at(-1)!] = value;
  return copy as T;
}

const emptyPerson: PersonValue = { name: null, email: null, phone: null };

const SEEDS = {
  listing_agent: { ...emptyPerson, brokerage: null },
  buyer_agent: { ...emptyPerson, brokerage: null },
  buyer_agent_2: { ...emptyPerson, brokerage: null },
  coop_coordinator: { ...emptyPerson },
  grant_counselor: { ...emptyPerson },
  lender: { company: null, loan_officer: null, processor: null },
  title: { company: null, file_no: null },
};

export function IntakeFlow({ useBlob }: { useBlob: boolean }) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const plan = useMemo(() => (contract ? buildPlan(resolveDates(contract)) : null), [contract]);
  const set = (path: (string | number)[], value: unknown) =>
    setContract((c) => {
      if (!c) return c;
      // Editing a party the contract didn't name: start from a complete empty record so it still validates.
      const head = path[0] as keyof typeof SEEDS;
      const seeded = path.length > 1 && head in SEEDS && c[head] == null ? setIn(c, [head], structuredClone(SEEDS[head])) : c;
      return setIn(seeded, path, value);
    });
  const text = (v: string) => (v.trim() === "" ? null : v);

  function choose(f: File | undefined) {
    if (!f) return;
    setError(null);
    setFile(f);
    start(async () => {
      const fd = new FormData();
      if (useBlob) {
        // Hosted: send the PDF straight to private storage, past the 4.5 MB request limit.
        try {
          const blob = await uploadPresigned(`contracts/${crypto.randomUUID()}.pdf`, f, { access: "private", handleUploadUrl: "/api/upload", contentType: "application/pdf" });
          setBlobUrl(blob.url);
          fd.set("blobUrl", blob.url);
          fd.set("filename", f.name);
        } catch (e) {
          setError(`The upload didn't go through: ${(e as Error).message}`);
          return;
        }
      } else fd.set("pdf", f);
      const res = await readContract(fd);
      if (res.ok) {
        setContract(res.contract);
        setStep("review");
      } else setError(res.error);
    });
  }

  function create() {
    if (!file || !contract) return;
    setError(null);
    const fd = new FormData();
    if (blobUrl) fd.set("blobUrl", blobUrl);
    else fd.set("pdf", file);
    fd.set("contract", JSON.stringify(contract));
    start(async () => {
      const res = await createFile(fd);
      if (res.ok) {
        setResult(res.result);
        setStep("done");
      } else setError(res.error);
    });
  }

  if (step === "upload") {
    return (
      <div className="stack-sm">
        <div
          className="dropzone"
          data-over={over}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); choose(e.dataTransfer.files[0]); }}
        >
          <h3>{pending ? "Reading the contract…" : "Drop the Agreement of Sale here"}</h3>
          <p className="ui subtle">{pending ? `${file?.name} · this takes about a minute` : "PDF, with every addendum, up to 30 MB"}</p>
          {!pending && <span className="btn btn-primary">Choose the PDF</span>}
          <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => choose(e.target.files?.[0])} />
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="stack">
        <section className="band">
          <span className="label">File created</span>
          <h2>{contract?.property.address}</h2>
          <div className="row">
            {result.folderUrl && <a className="btn btn-secondary" style={{ color: "var(--sidebar-text)", borderColor: "var(--sidebar-text)" }} href={result.folderUrl} target="_blank" rel="noreferrer">Open Drive folder</a>}
            <Link className="btn btn-ghost" style={{ color: "var(--sidebar-text)" }} href={`/files/${result.dealId}`}>View the file</Link>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h3>In your Gmail drafts</h3><span className="label">{result.drafts.length}</span></div>
          <ul className="list">
            {result.drafts.map((d) => (
              <li key={d.url}>
                <span>{d.subject}<br /><span className="meta">To {d.to}</span></span>
                <a className="btn btn-ghost btn-small" href={d.url} target="_blank" rel="noreferrer">Open</a>
              </li>
            ))}
          </ul>
        </section>
        {result.skyslope && (
          <section className="card">
            <div className="card-head"><h3>SkySlope</h3></div>
            <p className="ui">{result.skyslope}</p>
          </section>
        )}
        <section className="card">
          <div className="card-head"><h3>On your calendar</h3><span className="label">{result.events.length}</span></div>
          <ul className="list">
            {result.events.map((e) => <li key={e.id}><span>{e.step}</span><span className="meta">{formatShort(e.due)}</span></li>)}
          </ul>
        </section>
        {(result.warnings.length > 0 || result.errors.length > 0) && (
          <section className="card">
            <div className="card-head"><h3>For you to check</h3></div>
            <ul className="list">
              {result.errors.map((w) => <li key={w} className="tone-danger">{w}</li>)}
              {result.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (!contract || !plan) return null;
  const c = contract;

  return (
    <div className="stack">
      <section className="card stack-sm">
        <div className="card-head" style={{ marginBottom: 0 }}>
          <h3>Property and money</h3>
          <span className="ui subtle">{file?.name}</span>
        </div>
        <div className="form-grid">
          <Field label="Address" value={c.property.address} onChange={(v) => set(["property", "address"], v)} />
          <Field label="ZIP" value={c.property.zip} onChange={(v) => set(["property", "zip"], text(v))} />
          <div className="field">
            <label htmlFor="side">Jaz represents</label>
            <select id="side" className="input" value={c.side} onChange={(e) => set(["side"], e.target.value)}>
              <option>Buyer</option><option>Listing</option><option>Dual</option>
            </select>
          </div>
          <Field label="Price" type="number" value={c.price} onChange={(v) => set(["price"], v ? Number(v) : null)} />
          <Field label="Deposit" type="number" value={c.deposit_amount} onChange={(v) => set(["deposit_amount"], v ? Number(v) : null)} />
          <Field label="Financing" value={c.financing_type} onChange={(v) => set(["financing_type"], text(v))} />
          <Field label="Seller assist" value={c.seller_assist} onChange={(v) => set(["seller_assist"], text(v))} />
          <Field label="Grant program" value={c.grant_program} onChange={(v) => set(["grant_program"], text(v))} />
          <Field label="Title company" value={c.title?.company} onChange={(v) => set(["title", "company"], text(v))} />
          <div className="field">
            <label htmlFor="inspections">Inspections</label>
            <select id="inspections" className="input" value={c.inspection_type} onChange={(e) => set(["inspection_type"], e.target.value)}>
              <option value="contingency">Contingency (can negotiate or end the deal)</option>
              <option value="informational_only">Informational only</option>
              <option value="waived">Waived</option>
              <option value="unknown">Not sure</option>
            </select>
          </div>
          <Field label="Possession at settlement" value={c.possession} onChange={(v) => set(["possession"], text(v))} />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Dates</h3><span className="ui subtle">Amber means Claude couldn't confirm it</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Deadline</th><th>Date</th><th>From the contract</th></tr></thead>
            <tbody>
              {DATE_KEYS.map((k) => {
                const d = c.dates[k];
                return (
                  <tr key={k}>
                    <td><label htmlFor={`date-${k}`}>{DATE_LABELS[k]}</label></td>
                    <td className="nowrap">
                      <input
                        id={`date-${k}`}
                        type="date"
                        className={`input ${d.confirm || !d.date ? "flagged" : ""}`}
                        style={{ width: 180 }}
                        value={d.date ?? ""}
                        onChange={(e) => set(["dates", k], { ...d, date: e.target.value || null, confirm: false, days_after_execution: null })}
                      />
                      {d.days_after_execution != null && <div className="helper">{d.days_after_execution} days after execution</div>}
                    </td>
                    <td className={d.confirm ? "helper warn" : "subtle"}>{d.source || (d.confirm ? "Confirm" : "")}</td>
                  </tr>
                );
              })}
              {c.other_deadlines.map((d, i) => (
                <tr key={`other-${i}`}>
                  <td>{d.label}</td>
                  <td className="nowrap">
                    <input type="date" className={`input ${d.confirm || !d.date ? "flagged" : ""}`} style={{ width: 180 }} value={d.date ?? ""}
                      onChange={(e) => set(["other_deadlines", i], { ...d, date: e.target.value || null, confirm: false })} />
                  </td>
                  <td className="subtle">{d.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack-sm">
        <div className="card-head" style={{ marginBottom: 0 }}><h3>SkySlope</h3></div>
        <div className="form-grid">
          <Field label="SkySlope email" type="email" value={c.skyslope_email} onChange={(v) => set(["skyslope_email"], text(v))} />
        </div>
        <p className="helper">Open the transaction in SkySlope and copy the EMAIL field (it looks like ForrestAve7076@skyslope.com). Leave it blank if you haven't made the SkySlope file yet.</p>
      </section>

      <section className="card stack-sm">
        <div className="card-head" style={{ marginBottom: 0 }}><h3>People</h3></div>
        <PeopleEditor title="Buyers" people={c.buyers} onChange={(p) => set(["buyers"], p)} />
        {c.buyer_entity && <Field label="Buying entity" value={c.buyer_entity.name} onChange={(v) => set(["buyer_entity", "name"], v)} />}
        <PeopleEditor title="Sellers" people={c.sellers} onChange={(p) => set(["sellers"], p)} />
        <div className="form-grid">
          <Field label="Listing agent" value={c.listing_agent?.name} onChange={(v) => set(["listing_agent", "name"], text(v))} />
          <Field label="Listing agent email" type="email" value={c.listing_agent?.email} onChange={(v) => set(["listing_agent", "email"], text(v))} />
          <Field label="Listing brokerage" value={c.listing_agent?.brokerage} onChange={(v) => set(["listing_agent", "brokerage"], text(v))} />
          <Field label="Co-op transaction coordinator" value={c.coop_coordinator?.name} onChange={(v) => set(["coop_coordinator", "name"], text(v))} />
          <Field label="Co-op coordinator email" type="email" value={c.coop_coordinator?.email} onChange={(v) => set(["coop_coordinator", "email"], text(v))} />
          <Field label="Co-op coordinator phone" type="tel" value={c.coop_coordinator?.phone} onChange={(v) => set(["coop_coordinator", "phone"], text(v))} />
          <Field label="Housing counselor" value={c.grant_counselor?.name} onChange={(v) => set(["grant_counselor", "name"], text(v))} />
          <Field label="Housing counselor email" type="email" value={c.grant_counselor?.email} onChange={(v) => set(["grant_counselor", "email"], text(v))} />
          <Field label="Housing counselor phone" type="tel" value={c.grant_counselor?.phone} onChange={(v) => set(["grant_counselor", "phone"], text(v))} />
          <Field label="Second buyer agent" value={c.buyer_agent_2?.name} onChange={(v) => set(["buyer_agent_2", "name"], text(v))} />
          <Field label="Second buyer agent email" type="email" value={c.buyer_agent_2?.email} onChange={(v) => set(["buyer_agent_2", "email"], text(v))} />
          <Field label="Second buyer agent brokerage" value={c.buyer_agent_2?.brokerage} onChange={(v) => set(["buyer_agent_2", "brokerage"], text(v))} />
          <Field label="Lender" value={c.lender?.company} onChange={(v) => set(["lender", "company"], text(v))} />
          <Field label="Loan officer email" type="email" value={c.lender?.loan_officer?.email} onChange={(v) => set(["lender", "loan_officer"], { ...(c.lender?.loan_officer ?? emptyPerson), email: text(v) })} />
          <Field label="Processor email" type="email" value={c.lender?.processor?.email} onChange={(v) => set(["lender", "processor"], { ...(c.lender?.processor ?? emptyPerson), email: text(v) })} />
        </div>
      </section>

      <section className="card stack-sm">
        <div className="card-head" style={{ marginBottom: 0 }}><h3>What happens when you confirm</h3></div>
        <ul className="list">
          <li><span>Drive folder <strong>{plan.folderName}</strong> with subfolders 1 to 6, and the contract saved as <em>{plan.contractFilename}</em></span></li>
          <li><span>{plan.milestones.length} milestones on the dashboard, {plan.milestones.filter((m) => m.calendar).length} of them as all-day events on your calendar (no invites)</span></li>
          <li><span>{plan.deal.skyslope_email !== "Confirm"
            ? <>The contract is copied to <strong>{plan.deal.skyslope_email}</strong> for compliance. It's sent automatically if that's turned on in the tracker's Settings tab, otherwise it waits in your drafts.</>
            : "No SkySlope copy yet: add the SkySlope email above."}</span></li>
          {plan.drafts.map((d) => (
            <li key={d.kind}><span>Draft: {d.subject}<br /><span className="meta">To {[...d.to, ...d.cc].join(", ")}{d.attachContract ? " · contract attached" : ""}</span></span></li>
          ))}
        </ul>
        {plan.warnings.length > 0 && (
          <>
            <div className="label" style={{ marginTop: 12 }}>Check before you confirm</div>
            <ul className="list">{plan.warnings.map((w) => <li key={w} className="tone-warning">{w}</li>)}</ul>
          </>
        )}
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="row">
          <button className="btn btn-primary" disabled={pending || !c.property.address} onClick={create}>
            {pending ? "Setting up the file…" : "Confirm and create the file"}
          </button>
          <button className="btn btn-ghost" disabled={pending} onClick={() => { setStep("upload"); setContract(null); setFile(null); setBlobUrl(null); }}>
            Start over
          </button>
        </div>
      </section>
    </div>
  );
}

function Field(props: { label: string; value: string | number | null | undefined; onChange: (v: string) => void; type?: string }) {
  const id = `f-${props.label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <input id={id} className="input" type={props.type ?? "text"} value={props.value ?? ""} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

function PeopleEditor({ title, people, onChange }: { title: string; people: PersonValue[]; onChange: (p: PersonValue[]) => void }) {
  const update = (i: number, key: keyof PersonValue, v: string) =>
    onChange(people.map((p, j) => (j === i ? { ...p, [key]: v.trim() === "" ? null : v } : p)));
  return (
    <div className="stack-sm">
      <div className="label">{title}</div>
      {people.map((p, i) => (
        <div key={i} className="form-grid">
          <Field label={`${title.slice(0, -1)} ${i + 1} name`} value={p.name} onChange={(v) => update(i, "name", v)} />
          <Field label={`${title.slice(0, -1)} ${i + 1} email`} type="email" value={p.email} onChange={(v) => update(i, "email", v)} />
          <Field label={`${title.slice(0, -1)} ${i + 1} phone`} type="tel" value={p.phone} onChange={(v) => update(i, "phone", v)} />
        </div>
      ))}
      <div><button className="btn btn-ghost btn-small" onClick={() => onChange([...people, { ...emptyPerson }])}>Add {title.slice(0, -1).toLowerCase()}</button></div>
    </div>
  );
}
