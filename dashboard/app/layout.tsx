import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { loadTracker } from "@/lib/load";
import { lastUpdated } from "@/lib/view";
import { minutesSince } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BuySmart Transaction Desk",
  description: "Every active file at a glance, read from the BuySmart TC Tracker.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

function agoText(stamp: string | undefined): string {
  if (!stamp) return "Not updated yet";
  const mins = minutesSince(stamp);
  if (mins === null) return `Updated ${stamp}`;
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins} min ago`;
  if (mins < 1440) return `Updated ${Math.floor(mins / 60)} hr ago`;
  return `Updated ${Math.floor(mins / 1440)} days ago`;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const loaded = await loadTracker();
  const updated = loaded.ok ? agoText(lastUpdated(loaded.tracker)) : "Sheet not connected";
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&family=League+Spartan:wght@600;700&family=Lora:ital@0;1&family=Mulish:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <Shell updated={updated}>{children}</Shell>
      </body>
    </html>
  );
}
