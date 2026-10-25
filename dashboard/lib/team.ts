// Jaz's team members, from the tracker's Settings tab: one row per person, with key
// team_member_1, team_member_2 … and value "Name <email>". Each gets an on/off switch per file.

export interface TeamMember {
  name: string;
  email: string;
}

export function parseTeam(settings: Record<string, string>): TeamMember[] {
  return Object.entries(settings)
    .filter(([key]) => /^team_member/i.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, value]) => {
      const m = value.match(/^\s*(.*?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/);
      return m ? { name: m[1], email: m[2] } : null;
    })
    .filter((x): x is TeamMember => !!x);
}

export const formatTeam = (team: TeamMember[]) => team.map((t) => `${t.name} <${t.email}>`).join(", ");
