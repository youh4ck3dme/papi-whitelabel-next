import Link from "next/link";
import { brandConfig } from "@/config/brand";

export function AppTopBar() {
  return (
    <header className="topbar">
      <Link className="brand-mark" href="/">
        <span className="brand-dot" />
        <span>{brandConfig.shortName}</span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        <Link href="/booking">Booking</Link>
        <Link href="/admin/my">Employee</Link>
        <Link href="/admin/calendar">Admin</Link>
      </nav>
    </header>
  );
}
