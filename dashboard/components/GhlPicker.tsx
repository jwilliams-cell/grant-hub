"use client";

import { useState, useTransition } from "react";
import { findInGhl } from "@/app/ghl-actions";
import type { GhlContact } from "@/lib/ghl-rank";

/** "Find in GoHighLevel" next to a person: shows likely matches, Jaz picks one. */
export function GhlPicker({ name, onPick }: { name: string; onPick: (c: GhlContact) => void }) {
  const [matches, setMatches] = useState<GhlContact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function search() {
    setError(null);
    start(async () => {
      const res = await findInGhl(name);
      if (res.ok) setMatches(res.matches);
      else setError(res.error);
    });
  }

  return (
    <div className="stack-sm" style={{ gap: 8 }}>
      <div>
        <button type="button" className="btn btn-ghost btn-small" disabled={pending || !name.trim()} onClick={search}>
          {pending ? "Searching GoHighLevel…" : "Find in GoHighLevel"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {matches && (
        matches.length === 0 ? (
          <p className="helper">No one named {name.split(" ")[0]} in GoHighLevel.</p>
        ) : (
          <ul className="list">
            {matches.map((m) => (
              <li key={m.id}>
                <span>
                  {m.name || "No name"}
                  <br />
                  <span className="meta">{[m.email || "no email", m.phone, m.tags.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}</span>
                </span>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => { onPick(m); setMatches(null); }}>
                  Use
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
