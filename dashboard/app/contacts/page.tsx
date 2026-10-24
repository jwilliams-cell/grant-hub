import { loadTracker } from "@/lib/load";
import { SetupNeeded } from "@/components/bits";
import { ContactSearch } from "./ContactSearch";

export const metadata = { title: "Contacts · BuySmart Transaction Desk" };

export default async function ContactsPage() {
  const loaded = await loadTracker();
  if (!loaded.ok) return <SetupNeeded error={loaded.error} />;
  return (
    <div className="stack">
      <h1>Contacts</h1>
      <ContactSearch contacts={loaded.tracker.contacts} />
    </div>
  );
}
