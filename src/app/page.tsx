import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { brandConfig } from "@/config/brand";

export default function HomePage() {
  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">White-label starter</p>
        <h1>{brandConfig.name}</h1>
        <p className="lead">
          A clean booking foundation for salons: public reservation flow, admin calendar,
          employee schedule, mock data, and a Supabase-ready data boundary.
        </p>
        <div className="nav" style={{ justifyContent: "flex-start" }}>
          <Link className="button primary" href="/booking">
            Open booking
          </Link>
          <Link className="button" href="/admin/calendar">
            Open admin calendar
          </Link>
        </div>
      </section>

      <section className="section">
        <h2>Architecture</h2>
        <div className="grid three">
          <article className="card">
            <h3>Public booking</h3>
            <p className="muted">Customer-facing route with services, employees, and slot preview.</p>
          </article>
          <article className="card">
            <h3>Admin calendar</h3>
            <p className="muted">Owner/admin shell for full schedule visibility with mock controls.</p>
          </article>
          <article className="card">
            <h3>Supabase-ready</h3>
            <p className="muted">Repository interface isolates data access from UI routes.</p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
