import "server-only";
import { rankContacts, splitName, type GhlContact, type RawGhlContact } from "./ghl-rank.ts";

// Read-only GoHighLevel contact search, with a Private Integration token that has
// contacts.readonly. Nothing is written to GoHighLevel and no messages are sent.
const API = "https://services.leadconnectorhq.com";

export const ghlConfigured = () => !!(process.env.GHL_API_TOKEN?.trim() && process.env.GHL_LOCATION_ID?.trim());

export async function searchGhlContacts(fullName: string): Promise<GhlContact[]> {
  const token = process.env.GHL_API_TOKEN?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();
  if (!token || !locationId) throw new Error("GoHighLevel isn't connected yet. Add GHL_API_TOKEN and GHL_LOCATION_ID in Vercel.");
  const { first } = splitName(fullName);
  if (!first) return [];

  const res = await fetch(`${API}/contacts/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      locationId,
      pageLimit: 50,
      filters: [{ field: "firstNameLowerCase", operator: "eq", value: first }],
      sort: [{ field: "dateUpdated", direction: "desc" }],
    }),
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) throw new Error("GoHighLevel refused the token. Check GHL_API_TOKEN has contacts read access.");
  if (!res.ok) throw new Error(`GoHighLevel search failed (${res.status}).`);
  const data = (await res.json()) as { contacts?: RawGhlContact[] };
  return rankContacts(fullName, data.contacts ?? []);
}
