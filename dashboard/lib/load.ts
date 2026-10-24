import "server-only";
import { cache } from "react";
import { readTracker } from "./sheet";
import type { Tracker } from "./types";

export type Loaded = { ok: true; tracker: Tracker } | { ok: false; error: string };

/** One Sheet read per request, shared by the layout and the page. */
export const loadTracker = cache(async (): Promise<Loaded> => {
  try {
    return { ok: true, tracker: await readTracker() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
});
