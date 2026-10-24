"use server";

import { del, get } from "@vercel/blob";
import { extractContract, ExtractionError } from "@/lib/extract";
import { ContractSchema, resolveDates, type Contract } from "@/lib/contract";
import { buildPlan } from "@/lib/plan";
import { runIntake, type IntakeResult } from "@/lib/intake";

const MAX_BYTES = 30 * 1024 * 1024;

/** The contract arrives either as a file (local) or as a private Blob URL (hosted). */
async function readPdf(formData: FormData): Promise<{ pdf: Buffer; name: string; blobUrl?: string }> {
  const blobUrl = formData.get("blobUrl");
  let pdf: Buffer;
  let name: string;
  if (typeof blobUrl === "string" && blobUrl) {
    if (!new URL(blobUrl).pathname.startsWith("/contracts/")) throw new ExtractionError("That upload isn't a contract.");
    const blob = await get(blobUrl, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200) throw new ExtractionError("The uploaded contract couldn't be found. Upload it again.");
    if (blob.blob.size > MAX_BYTES) throw new ExtractionError("That PDF is over 30 MB. Try a smaller scan.");
    pdf = Buffer.from(await new Response(blob.stream).arrayBuffer());
    name = String(formData.get("filename") || "Agreement of Sale.pdf");
  } else {
    const file = formData.get("pdf");
    if (!(file instanceof File) || file.size === 0) throw new ExtractionError("Choose the signed Agreement of Sale as a PDF.");
    if (file.size > MAX_BYTES) throw new ExtractionError("That PDF is over 30 MB. Try a smaller scan.");
    pdf = Buffer.from(await file.arrayBuffer());
    name = file.name;
  }
  if (pdf.subarray(0, 5).toString() !== "%PDF-") throw new ExtractionError("That file isn't a PDF.");
  return { pdf, name, blobUrl: typeof blobUrl === "string" && blobUrl ? blobUrl : undefined };
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
    const { pdf, blobUrl } = await readPdf(formData);
    const parsed = ContractSchema.safeParse(JSON.parse(String(formData.get("contract") ?? "null")));
    if (!parsed.success) return { ok: false, error: "The reviewed contract details didn't come through. Reload and try again." };
    const plan = buildPlan(resolveDates(parsed.data));
    if (!plan.deal.address) return { ok: false, error: "The property address is missing." };
    const result = await runIntake(plan, pdf);
    // The contract now lives in Drive; don't keep a second copy in Blob storage.
    if (blobUrl) await del(blobUrl).catch(() => {});
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
