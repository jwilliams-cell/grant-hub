// What the dashboard pages compute from the Sheet. Pure, so it's easy to test.

import { addDays, daysBetween, isISODate } from "./dates.ts";
import type { Deal, Milestone, Tracker } from "./types.ts";

export type Tone = "success" | "warning" | "danger" | "link" | "neutral";

export function toneFor(status: string): Tone {
  switch (status) {
    case "Done":
    case "Closed":
    case "Sent":
      return "success";
    case "Waiting":
    case "Waiting for Jaz":
      return "warning";
    case "Late":
    case "Flagged":
      return "danger";
    case "Scheduled":
    case "Active":
      return "link";
    default:
      return "neutral";
  }
}

export const STAGES = ["Contract", "Deposit", "Inspection", "Appraisal", "Commitment", "Clear to close", "Settlement", "Compliance"] as const;
export type Stage = (typeof STAGES)[number];

const STAGE_MATCH: Record<Stage, RegExp> = {
  Contract: /under contract|agreement of sale fully signed/i,
  Deposit: /deposit/i,
  Inspection: /inspection/i,
  Appraisal: /apprais/i,
  Commitment: /^(?!.*title).*mortgage commitment|^commitment/i,
  "Clear to close": /clear to close/i,
  Settlement: /^settlement\b/i,
  Compliance: /compliance/i,
};

export type StageState = "done" | "current" | "upcoming";

/** Contract → … → Compliance, each done when every matching milestone is done. */
export function stepper(deal: Deal, milestones: Milestone[]): { stage: Stage; state: StageState }[] {
  const closed = deal.status === "Closed";
  const done = STAGES.map((stage) => {
    if (closed) return true;
    const ms = milestones.filter((m) => STAGE_MATCH[stage].test(m.step));
    if (stage === "Contract" && !ms.length) return true;
    return ms.length > 0 && ms.every((m) => m.status === "Done");
  });
  let currentSet = false;
  return STAGES.map((stage, i) => {
    if (done[i]) return { stage, state: "done" as const };
    if (!currentSet && deal.status === "Active") {
      currentSet = true;
      return { stage, state: "current" as const };
    }
    return { stage, state: "upcoming" as const };
  });
}

export const isOpen = (m: Milestone) => m.status !== "Done";

export function isLate(m: Milestone, today: string): boolean {
  if (m.status === "Late") return true;
  return isOpen(m) && m.status !== "Scheduled" && isISODate(m.due) && m.due < today;
}

export function nextStep(milestones: Milestone[]): Milestone | undefined {
  const open = milestones.filter(isOpen);
  return open.find((m) => m.status === "Late" || m.status === "Flagged") ?? open.find((m) => isISODate(m.due)) ?? open[0];
}

export interface TodayView {
  nextSettlement?: { deal: Deal; days: number };
  activeCount: number;
  openItems: number;
  waitingOnOthers: number;
  late: { deal: Deal; m: Milestone }[];
  dueSoon: { deal: Deal; m: Milestone }[];
  draftsWaiting: Tracker["drafts"];
}

export function todayView(t: Tracker, today: string): TodayView {
  const active = t.deals.filter((d) => d.status === "Active");
  const activeIds = new Set(active.map((d) => d.deal_id));
  const byId = new Map(t.deals.map((d) => [d.deal_id, d]));
  const ms = t.milestones.filter((m) => activeIds.has(m.deal_id));
  const upcoming = active
    .filter((d) => isISODate(d.settlement_date) && d.settlement_date >= today)
    .sort((a, b) => a.settlement_date.localeCompare(b.settlement_date));
  const soon = addDays(today, 2);
  const pair = (m: Milestone) => ({ deal: byId.get(m.deal_id)!, m });
  const byDue = (a: { m: Milestone }, b: { m: Milestone }) => a.m.due.localeCompare(b.m.due);

  return {
    nextSettlement: upcoming[0] && { deal: upcoming[0], days: daysBetween(today, upcoming[0].settlement_date) },
    activeCount: active.length,
    openItems: ms.filter(isOpen).length,
    waitingOnOthers: ms.filter((m) => m.status === "Waiting").length,
    late: ms.filter((m) => isLate(m, today)).map(pair).sort(byDue),
    dueSoon: ms.filter((m) => isOpen(m) && !isLate(m, today) && isISODate(m.due) && m.due >= today && m.due <= soon).map(pair).sort(byDue),
    draftsWaiting: t.drafts.filter((d) => d.status === "Waiting for Jaz"),
  };
}

export function lastUpdated(t: Tracker): string | undefined {
  return t.activity.map((a) => a.at).filter(Boolean).sort().at(-1);
}
