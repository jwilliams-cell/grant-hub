import { test } from "node:test";
import assert from "node:assert/strict";
import { rankContacts } from "./ghl-rank.ts";

const raw = [
  { id: "1", firstName: "Alexis", lastName: "Jones", contactName: "alexis jones", email: "aj@example.com", tags: ["rental inquiry"] },
  { id: "2", firstName: "alexis", lastName: "mc", contactName: "alexis mc", email: "amc@example.com", phone: "+12675550100", tags: ["home buyer client"] },
  { id: "3", firstName: "Alexis", lastName: "McIntosh", contactName: "alexis mcintosh", email: null, tags: [] },
  { id: "4", firstName: "Alexis", lastName: null, contactName: "alexis", email: "a@example.com", tags: [] },
];

test("partial last names in GoHighLevel still match, buyer clients first", () => {
  const ids = rankContacts("Alexis McIntosh", raw).map((c) => c.id);
  assert.deepEqual(ids, ["2", "3", "4"]); // "mc" client with email, then the McIntosh with no email, then first-name only
  assert.ok(!ids.includes("1"), "a different last name is left out");
});

test("when no last name matches, first-name matches are still offered", () => {
  const ids = rankContacts("Alexis Zimmer", raw.filter((c) => c.id === "1")).map((c) => c.id);
  assert.deepEqual(ids, ["1"]);
});
