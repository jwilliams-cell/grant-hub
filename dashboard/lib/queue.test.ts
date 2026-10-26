import { test } from "node:test";
import assert from "node:assert/strict";
import { listAttachments, pickAttachment, validateQueueRow } from "./queue-logic.ts";
import { QUEUE_COLS, type QueueRow } from "./types.ts";

const tina = {
  parts: [
    { parts: [{ mimeType: "text/plain" }, { filename: "image001.png", mimeType: "image/png", body: { attachmentId: "s1", size: 3000 } }] },
    { filename: "McIntosh Commitment.pdf", mimeType: "application/pdf", body: { attachmentId: "c1", size: 1_013_195 } },
  ],
};

test("finds the commitment PDF and skips signature images", () => {
  const found = listAttachments(tina);
  assert.deepEqual(found.map((a) => a.filename), ["McIntosh Commitment.pdf"]);
  assert.equal(pickAttachment(found, "").attachmentId, "c1");
  assert.equal(pickAttachment(found, "mcintosh commitment.pdf").attachmentId, "c1");
  assert.throws(() => pickAttachment(found, "Appraisal.pdf"), /No attachment named/);
});

test("never guesses between several PDFs", () => {
  const two = [...listAttachments(tina), { filename: "Conditions.pdf", mimeType: "application/pdf", attachmentId: "x", size: 9 }];
  assert.throws(() => pickAttachment(two, ""), /Name the attachment/);
});

const row = (over: Partial<QueueRow>): QueueRow => ({ ...Object.fromEntries(QUEUE_COLS.map((c) => [c, ""])), id: "1", deal_id: "5722-malcolm", gmail_message_id: "abc", ...over }) as QueueRow;

test("queue rows are checked before anything runs", () => {
  assert.equal(validateQueueRow(row({ action: "draft", to: "soldbygold24@gmail.com", subject: "5722 Malcolm St – Mortgage Commitment" })), "");
  assert.match(validateQueueRow(row({ action: "draft", to: "", subject: "x" })), /to address/);
  assert.match(validateQueueRow(row({ action: "draft", to: "Dave", subject: "x" })), /isn't an email/);
  assert.equal(validateQueueRow(row({ action: "file", drive_subfolder: "3 Lender", filename: "5722 Malcolm St – McIntosh – Mortgage Commitment – 2026-10-26.pdf" })), "");
  assert.match(validateQueueRow(row({ action: "file", drive_subfolder: "Lender", filename: "x.pdf" })), /drive_subfolder/);
  assert.match(validateQueueRow(row({ action: "file", drive_subfolder: "3 Lender", filename: "commitment.pdf" })), /filename must follow/);
  assert.match(validateQueueRow(row({ action: "send" })), /unknown action/);
});
