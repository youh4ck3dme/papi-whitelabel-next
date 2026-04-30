import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function AdminLoginPage() {
  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">Admin login shell</p>
        <h1>Owner and staff access</h1>
        <p className="lead">
          This starter intentionally uses no real auth. Wire this page to Supabase Auth when
          moving from mock mode to production mode.
        </p>
        <Link className="button primary" href="/admin/calendar">
          Continue to calendar
        </Link>
      </section>
    </PageShell>
  );
}
