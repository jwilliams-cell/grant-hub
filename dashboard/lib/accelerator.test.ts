import { test } from "node:test";
import assert from "node:assert/strict";
import { checklistName, firstMonday, folderName, needsNotifiedShare, parseEnrollee } from "./accelerator-logic.ts";

test("reads GoHighLevel's standard webhook", () => {
  const e = parseEnrollee({ contact_id: "c1", first_name: "Tiffany", last_name: "Hammond", email: "Tiffany@Example.com ", phone: "+12155550100" });
  assert.deepEqual(e, { contactId: "c1", first: "Tiffany", last: "Hammond", email: "tiffany@example.com", phone: "+12155550100" });
  assert.equal(folderName(e), "Tiffany Hammond – Accelerator");
  assert.equal(checklistName(e), "Accelerator 12-Week Checklist – Tiffany Hammond");
});

test("reads a custom webhook with a nested contact and a full name only", () => {
  const e = parseEnrollee({ contact: { id: "c2", name: "Aliah  Lewis", email: "a@example.com" } });
  assert.equal(e.first, "Aliah");
  assert.equal(e.last, "Lewis");
});

test("refuses a webhook without an id, email or name", () => {
  assert.throws(() => parseEnrollee({ first_name: "A", email: "a@example.com" }), /contact_id/);
  assert.throws(() => parseEnrollee({ contact_id: "c", first_name: "A", email: "not an email" }), /email/);
  assert.throws(() => parseEnrollee({ contact_id: "c", email: "a@example.com" }), /name/);
  assert.throws(() => parseEnrollee(null), /contact_id/);
});

test("starts on the first Monday on or after enrollment", () => {
  assert.equal(firstMonday("2026-10-29"), "2026-11-02"); // Thursday
  assert.equal(firstMonday("2026-11-02"), "2026-11-02"); // Monday
  assert.equal(firstMonday("2026-11-01"), "2026-11-02"); // Sunday
});

test("spots Drive's no-Google-account share refusal", () => {
  assert.ok(needsNotifiedShare("You are trying to invite a@yahoo.com. Since there is no Google account associated with this email address, you must check the \"Notify people\" box"));
  assert.ok(!needsNotifiedShare("The user does not have sufficient permissions for this file."));
});
