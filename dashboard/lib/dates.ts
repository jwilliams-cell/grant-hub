// Dates are plain YYYY-MM-DD strings everywhere, in Philadelphia time.

const TZ = "America/New_York";

export function todayET(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isISODate(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUTC(value).getTime());
}

export function addDays(iso: string, days: number): string {
  const date = toUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUTC(date);
}

/** Business days before a date, skipping weekends (holidays are not counted). */
export function businessDaysBefore(iso: string, days: number): string {
  const date = toUTC(iso);
  let left = days;
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() - 1);
    const dow = date.getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return fromUTC(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

export function formatLong(iso: string): string {
  if (!isISODate(iso)) return iso;
  return toUTC(iso).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatShort(iso: string): string {
  if (!isISODate(iso)) return iso || "—";
  return toUTC(iso).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
}

/** "2026-10-24 15:15" (Sheet time, Eastern) for the Activity tab. */
export function nowStampET(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour").replace("24", "00")}:${get("minute")}`;
}

/** Minutes since an Activity stamp, treating it as Eastern time. */
export function minutesSince(stamp: string, now: Date = new Date()): number | null {
  const m = stamp.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  const nowStamp = nowStampET(now);
  const n = nowStamp.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/)!;
  const days = daysBetween(m[1], n[1]);
  return days * 1440 + (Number(n[2]) - Number(m[2])) * 60 + (Number(n[3]) - Number(m[3]));
}
