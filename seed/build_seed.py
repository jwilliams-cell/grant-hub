"""Turn the prototype dashboard's JSON into rows for the BuySmart TC Tracker Sheet.

Usage: python seed/build_seed.py  -> writes seed/sheet-rows.json
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent

DEAL_COLS = ["deal_id", "address", "client", "client_email", "side", "status", "price",
             "financing", "lender", "loan_officer_email", "processor_email", "title_co",
             "title_file_no", "other_agent", "other_agent_email", "execution_date",
             "settlement_date", "settlement_time", "drive_folder_id", "skyslope_email",
             "grant_program", "notes"]
MILESTONE_COLS = ["deal_id", "seq", "step", "due", "date_type", "status", "owner", "note",
                  "calendar_event_id", "source_link"]

FOLDERS = {
    "5722 Malcolm St": "19YY-VR8AFhgoJHIMGQYJ760GBHojICzj",
    "7076 Forrest Ave": "1jVrV4FBHCLb7GtJWfB136ywyndH7nEFd",
    "148 Millick St": "1MIblRaKMAW1CB6dEwqV5cWtrnBhBPnpb",
    "125 S 54th St": "13Z93C9oth1QdcRZF9L9C4NhTcuXKutZ_",
    "1218 S Peach St": "1mWQ4MgnscSr_KU6xK9sqJlhyom0RTXPH",
    "237 Albanus St": "1RP1Z5MJ-hr1Vdj9XyRDzkU8WZs9iI-7r",
}

# Facts from email threads that the prototype kept in free text.
EXTRA = {
    "5722 Malcolm St": {"price": 210000, "financing": "FHA",
                        "loan_officer_email": "clowrie@myfccb.com",
                        "processor_email": "camehaffey@myfccb.com",
                        "grant_program": "Affordable Housing Centers of PA"},
    "7076 Forrest Ave": {"client": "Confirm", "client_email": "bulisani@gmail.com"},
    "125 S 54th St": {"financing": "Hard money", "other_agent_email": ""},
    "148 Millick St": {"other_agent_email": "karima@settledownphiladelphia.com", "other_agent": ""},
    "1218 S Peach St": {"financing": "Refinance"},
    "237 Albanus St": {"financing": "Refinance"},
}

SIDES = {"Buyer (hard money)": "Hard money", "Buyer (coached)": "Buyer"}


def slug(address):
    words = address.lower().split()
    if words[-1] in {"st", "ave", "rd", "dr", "ln", "ter"}:
        words = words[:-1]
    return re.sub(r"[^a-z0-9-]", "", "-".join(words))


def text(v):
    """Keep IDs and anything Sheets might parse as text."""
    return f"'{v}" if v else ""


def deal_row(d):
    title = d["title_co"]
    m = re.match(r"(.*?)\s*\((QA[\d-]+)\)", title)
    title_co, file_no = (m.group(1), m.group(2)) if m else (title, "")
    notes = d["notes"]
    if d["side"] == "Buyer (coached)":
        notes = "Coached file. " + notes
    row = {c: "" for c in DEAL_COLS}
    row.update({
        "deal_id": slug(d["address"]), "address": d["address"], "client": d["client"],
        "side": SIDES.get(d["side"], d["side"]), "status": d["status"],
        "lender": d["lender"], "title_co": title_co, "title_file_no": file_no,
        "other_agent": d["other_agent"], "settlement_date": d["date"],
        "drive_folder_id": text(FOLDERS.get(d["address"], "")),
        "skyslope_email": "Confirm" if d["status"] == "Active" else "",
        "notes": notes,
    })
    row.update(EXTRA.get(d["address"], {}))
    return [row[c] for c in DEAL_COLS]


def milestone_row(m):
    date_type = "Contract" if m["date_type"] == "Scheduled" else m["date_type"]
    return [slug(m["deal"]), m["order"], m["step"], m["due"], date_type, m["status"],
            m["owner"], m["note"], "", ""]


def main():
    deals = json.loads((HERE / "prototype-deals.json").read_text())
    milestones = json.loads((HERE / "prototype-milestones.json").read_text())
    out = {
        "Deals": [DEAL_COLS] + [deal_row(d) for d in deals],
        "Milestones": [MILESTONE_COLS] + [milestone_row(m) for m in milestones],
    }
    (HERE / "sheet-rows.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
