// One-time: sign in as jwilliams@gremom.com and print the refresh token for .env.
// Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm run google-auth
// The OAuth client must be a "Desktop app" client in Google Cloud Console.
import http from "node:http";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.compose",
];
const PORT = 53682;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.");
  process.exit(1);
}

const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `http://127.0.0.1:${PORT}`);
const url = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES, login_hint: "jwilliams@gremom.com" });

http
  .createServer(async (req, res) => {
    const code = new URL(req.url, `http://127.0.0.1:${PORT}`).searchParams.get("code");
    if (!code) return res.end();
    const { tokens } = await client.getToken(code);
    res.end("Done. You can close this tab.");
    console.log(`\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    process.exit(0);
  })
  .listen(PORT, () => console.log(`Open this link and sign in:\n\n${url}\n`));
