import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <Link className="button primary" href="/">
          Back home
        </Link>
      </section>
    </PageShell>
  );
}
