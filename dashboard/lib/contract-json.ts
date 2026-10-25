// Reading Claude's contract reply. The contract form is too large for the API's strict structured
// output, so Claude answers with JSON in plain text and this checks it against ContractWireSchema.

import { z } from "zod";
import { ContractWireSchema, type ContractWire } from "./contract.ts";

/** The form Claude fills, as a JSON Schema for the system prompt. Field descriptions carry the rules. */
export const CONTRACT_JSON_SCHEMA = JSON.stringify(z.toJSONSchema(ContractWireSchema));

export type ParsedReply = { ok: true; value: ContractWire } | { ok: false; problems: string };

/** Pulls the JSON object out of a reply that may be wrapped in a code fence or a sentence. */
export function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : null;
}

export function parseContractReply(text: string): ParsedReply {
  const json = extractJsonObject(text);
  if (!json) return { ok: false, problems: "The reply had no JSON object." };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return { ok: false, problems: `The JSON didn't parse: ${(e as Error).message}` };
  }
  const result = ContractWireSchema.safeParse(data);
  if (result.success) return { ok: true, value: result.data };
  const problems = result.error.issues
    .slice(0, 20)
    .map((i) => `${i.path.join(".") || "(top level)"}: ${i.message}`)
    .join("\n");
  return { ok: false, problems };
}
