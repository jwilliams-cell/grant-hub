"use server";

import { searchGhlContacts } from "@/lib/ghl";
import type { GhlContact } from "@/lib/ghl-rank";

export async function findInGhl(fullName: string): Promise<{ ok: true; matches: GhlContact[] } | { ok: false; error: string }> {
  try {
    return { ok: true, matches: await searchGhlContacts(String(fullName ?? "").slice(0, 120)) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
