"use client";

import { useState } from "react";
import type { Contact } from "@/lib/types";

export function ContactSearch({ contacts }: { contacts: Contact[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? contacts.filter((c) => Object.values(c).some((v) => v.toLowerCase().includes(needle))) : contacts;
  return (
    <div className="stack-sm">
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="contact-search">Search</label>
        <input id="contact-search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, company or email" />
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Company</th><th>Email</th><th>Phone</th><th>Notes</th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={`${c.name}-${c.email}`}>
                  <td>{c.name}</td>
                  <td>{c.role}</td>
                  <td>{c.company}</td>
                  <td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</td>
                  <td className="nowrap">{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : "—"}</td>
                  <td className="subtle">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length && <p className="subtle ui">No one matches “{q}”.</p>}
      </div>
    </div>
  );
}
