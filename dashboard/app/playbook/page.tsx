import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

export const metadata = { title: "Playbook · BuySmart Transaction Desk" };

// Rendered from transaction-coordinator.md in the repo root, so the page and the automation read the same text.
export default async function PlaybookPage() {
  // `npm run build` copies the playbook into content/ so it ships with the app; locally, read it in place.
  const local = path.join(process.cwd(), "content", "transaction-coordinator.md");
  const md = (await readFile(local, "utf8").catch(() => readFile(path.join(process.cwd(), "..", "transaction-coordinator.md"), "utf8")))
    .replace(/^---[\s\S]*?---\n/, "");
  // The playbook is our own file, but escape raw HTML anyway so nothing in it can run as markup.
  const html = await marked.parse(md.replace(/</g, "&lt;"));
  return (
    <div className="stack">
      <h1>Playbook</h1>
      <p className="muted prose">Sarah Cadman's process, stage by stage. Edit <code>transaction-coordinator.md</code> to change it.</p>
      <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
