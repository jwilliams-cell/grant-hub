"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/files", label: "Files" },
  { href: "/new", label: "New contract" },
  { href: "/playbook", label: "Playbook" },
  { href: "/templates", label: "Templates" },
  { href: "/contacts", label: "Contacts" },
];

const REFRESH_MS = 5 * 60 * 1000;

export function Shell({ children, updated }: { children: ReactNode; updated: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  // The Sheet is re-read on every load; this keeps an open tab current too.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const current = theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch {}
  }

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="shell" data-drawer={open ? "open" : "closed"}>
      <aside className="sidebar" aria-label="Main">
        <div>
          <Link href="/" className="brand">
            <span className="brand-word">BuySmart</span>
            <span className="brand-dot" aria-hidden />
          </Link>
          <div className="brand-sub">Transaction desk</div>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="tagline">A plan, not a pitch.</p>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-small menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            Menu
          </button>
          <span className="updated">{updated}</span>
          <span className="spacer" />
          <button className="btn btn-ghost btn-small" onClick={toggleTheme}>
            <span className="long-label">Light / dark</span>
            <span aria-hidden className="short-label">◐</span>
          </button>
          {pathname !== "/new" && (
            <Link href="/new" className="btn btn-primary btn-small">
              <span className="long-label">Add a contract</span>
              <span className="short-label-text">+ Contract</span>
            </Link>
          )}
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
