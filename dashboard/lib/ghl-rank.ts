// Ranking GoHighLevel contacts against a name from a contract. Names in GoHighLevel are often
// partial ("alexis mc" for Alexis McIntosh), so Jaz always picks; nothing is filled in on its own.

export interface GhlContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
}

export interface RawGhlContact {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags?: string[] | null;
}

const CLIENT_TAG = /home buyer client|client/i;

export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? "", last: parts.length > 1 ? parts[parts.length - 1] : "" };
}

/** Last names match when one starts with the other ("mc" and "mcintosh"), ignoring punctuation. */
function lastNameMatches(a: string, b: string): boolean {
  const x = a.toLowerCase().replace(/[^a-z]/g, "");
  const y = b.toLowerCase().replace(/[^a-z]/g, "");
  if (!x || !y) return false;
  return x.startsWith(y) || y.startsWith(x);
}

export function rankContacts(fullName: string, raw: RawGhlContact[], limit = 6): GhlContact[] {
  const { last } = splitName(fullName);
  const scored = raw.map((c) => {
    const tags = c.tags ?? [];
    let score = 0;
    if (last && lastNameMatches(c.lastName ?? "", last)) score += 4;
    if (tags.some((t) => CLIENT_TAG.test(t))) score += 2;
    if (c.email) score += 1;
    return {
      score,
      contact: {
        id: c.id,
        name: (c.contactName || [c.firstName, c.lastName].filter(Boolean).join(" ")).trim(),
        email: c.email ?? "",
        phone: c.phone ?? "",
        tags,
      },
    };
  });
  // With a last name to go on, drop people whose last name clearly doesn't match.
  // If none match, show the first-name matches anyway so Jaz can still pick.
  const close = last ? scored.filter((s) => s.score >= 4 || !s.contact.name.includes(" ")) : scored;
  const kept = close.length ? close : scored;
  return kept.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.contact);
}
