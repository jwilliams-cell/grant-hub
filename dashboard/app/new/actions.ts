"use server";

import { extractContract, ExtractionError } from "@/lib/extract";
import { ContractSchema, resolveDates, type Contract } from "@/lib/contract";
import { buildPlan } from "@/lib/plan";
import { runIntake, type IntakeResult } from "@/lib/intake";

const MAX_BYTES = 30 * 1024 * 1024;

async function readPdf(formData: FormData): Promise<{ pdf: Buffer; name: string }> {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) throw new ExtractionError("Choose the signed Agreement of Sale as a PDF.");
  if (file.size > MAX_BYTES) throw new ExtractionError("That PDF is over 30 MB. Try a smaller scan.");
  const pdf = Buffer.from(await file.arrayBuffer());
  if (pdf.subarray(0, 5).toString() !== "%PDF-") throw new ExtractionError("That file isn't a PDF.");
  return { pdf, name: file.name };
}

export async function readContract(formData: FormData): Promise<{ ok: true; contract: Contract } | { ok: false; error: string }> {
  try {
    const { pdf, name } = await readPdf(formData);
    return { ok: true, contract: await extractContract(pdf, name) };
  } catch (e) {
    return { ok: false, error: e instanceof ExtractionError ? e.message : `Something went wrong reading the contract: ${(e as Error).message}` };
  }
}

export async function createFile(formData: FormData): Promise<{ ok: true; result: IntakeResult } | { ok: false; error: string }> {
  try {
    const { pdf } = await readPdf(formData);
    const parsed = ContractSchema.safeParse(JSON.parse(String(formData.get("contract") ?? "null")));
    if (!parsed.success) return { ok: false, error: "The reviewed contract details didn't come through. Reload and try again." };
    const plan = buildPlan(resolveDates(parsed.data));
    if (!plan.deal.address) return { ok: false, error: "The property address is missing." };
    return { ok: true, result: await runIntake(plan, pdf) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
