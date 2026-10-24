import { IntakeFlow } from "./IntakeFlow";

export const metadata = { title: "New contract · BuySmart Transaction Desk" };

export default function NewContractPage() {
  return (
    <div className="stack">
      <div className="section">
        <h1>New contract</h1>
        <p className="muted prose">
          Drop in the fully signed Agreement of Sale. Claude reads every date and contact, then you check them here.
          Nothing is created until you say so. After that, the Drive folder, calendar deadlines and day-one email drafts are set up,
          and the file shows on the dashboard. No email is sent: everything waits in your Gmail drafts.
        </p>
      </div>
      <IntakeFlow />
    </div>
  );
}
