// The contact fields on a file that Jaz can edit from the dashboard (Deals columns).
export const PEOPLE_FIELDS = [
  { key: "client", label: "Client", email: false },
  { key: "client_email", label: "Client email", email: true },
  { key: "other_agent", label: "Other agent", email: false },
  { key: "other_agent_email", label: "Other agent email", email: true },
  { key: "buyer_agent_2", label: "Second buyer agent", email: false },
  { key: "buyer_agent_2_email", label: "Second buyer agent email", email: true },
  { key: "coop_tc", label: "Co-op transaction coordinator", email: false },
  { key: "coop_tc_email", label: "Co-op coordinator email", email: true },
  { key: "lender", label: "Lender", email: false },
  { key: "loan_officer", label: "Loan officer", email: false },
  { key: "loan_officer_email", label: "Loan officer email", email: true },
  { key: "processor_email", label: "Processor email", email: true },
  { key: "housing_counselor", label: "Housing counselor", email: false },
  { key: "housing_counselor_email", label: "Housing counselor email", email: true },
  { key: "title_co", label: "Title company", email: false },
  { key: "title_file_no", label: "Title file number", email: false },
  { key: "skyslope_email", label: "SkySlope email", email: true },
] as const;

export type PeopleField = (typeof PEOPLE_FIELDS)[number]["key"];
