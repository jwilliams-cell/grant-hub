import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

export const metadata = { title: "Playbook · BuySmart Transaction Desk" };

// Rendered from transaction-coordinator.md in the repo root, so the page and the automation read the same text.
export default async function PlaybookPage() {
  const file = path.join(process.cwd(), "..", "transaction-coordinator.md");
  const md = (await readFile(file, "utf8")).replace(/^---[\s\S]*?---\n/, "");
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
