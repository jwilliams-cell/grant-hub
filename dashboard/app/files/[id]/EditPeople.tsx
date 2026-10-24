"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePeople } from "./actions";
import { PEOPLE_FIELDS, type PeopleField } from "@/lib/people";
import { GhlPicker } from "@/components/GhlPicker";

export function EditPeople({ dealId, initial }: { dealId: string; initial: Record<PeopleField, string> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: PeopleField, v: string) => setValues((s) => ({ ...s, [k]: v }));

  if (!open) {
    return (
      <div className="row">
        <button className="btn btn-secondary btn-small" onClick={() => { setValues(initial); setMessage(null); setOpen(true); }}>Edit people</button>
        {message && <span className={message.ok ? "helper" : "error-text"}>{message.text}</span>}
      </div>
    );
  }

  function save() {
    setMessage(null);
    start(async () => {
      const res = await updatePeople(dealId, values);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: res.changed ? `Saved ${res.changed} change${res.changed === 1 ? "" : "s"} to the tracker.` : "Nothing changed." });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="stack-sm">
      <div className="form-grid">
        {PEOPLE_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`p-${f.key}`}>{f.label}</label>
            <input id={`p-${f.key}`} className="input" type="text" inputMode={f.email ? "email" : undefined}
              value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            {f.key === "client_email" && (
              <GhlPicker name={values.client ?? ""} onPick={(m) => setValues((s) => ({ ...s, client_email: m.email || s.client_email }))} />
            )}
          </div>
        ))}
      </div>
      <p className="helper">Saving updates this file's row in the tracker and logs what changed. Emails already in your drafts aren't changed.</p>
      {message && !message.ok && <p className="error-text" role="alert">{message.text}</p>}
      <div className="row">
        <button className="btn btn-primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save people"}</button>
        <button className="btn btn-ghost" disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
