"use server";

import { revalidatePath } from "next/cache";
import { appendRows, updateDealCells } from "@/lib/sheet";
import { isSkySlopeAddress } from "@/lib/skyslope";
import { nowStampET } from "@/lib/dates";
import { ACTIVITY_COLS } from "@/lib/types";
import { PEOPLE_FIELDS, type PeopleField } from "@/lib/people";

const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export async function updatePeople(dealId: string, values: Partial<Record<PeopleField, string>>): Promise<{ ok: true; changed: number } | { ok: false; error: string }> {
  try {
    const clean: Record<string, string> = {};
    for (const f of PEOPLE_FIELDS) {
      const v = values[f.key];
      if (v === undefined) continue;
      const t = String(v).trim();
      if (f.email && t) {
        // Client email can hold more than one address, comma separated.
        const parts = t.split(/\s*,\s*/).filter(Boolean);
        if (!parts.every((p) => EMAIL.test(p))) return { ok: false, error: `${f.label} doesn't look like an email address.` };
      }
      if (f.key === "skyslope_email" && t && t !== "Confirm" && !isSkySlopeAddress(t)) {
        return { ok: false, error: "The SkySlope email must end in @skyslope.com. Copy it from the EMAIL field on the SkySlope transaction page." };
      }
      clean[f.key] = f.key === "skyslope_email" && !t ? "Confirm" : t;
    }
    const changed = await updateDealCells(dealId, clean);
    const keys = Object.keys(changed);
    if (keys.length) {
      const label = (k: string) => PEOPLE_FIELDS.find((f) => f.key === k)?.label ?? k;
      await appendRows("Activity", ACTIVITY_COLS, [{
        at: nowStampET(), deal_id: dealId, event: "People updated",
        detail: keys.map((k) => `${label(k)}: ${changed[k].from || "blank"} → ${changed[k].to || "blank"}`).join("; "),
        source_link: "", by: "Jaz",
      }]);
    }
    revalidatePath(`/files/${dealId}`);
    return { ok: true, changed: keys.length };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
