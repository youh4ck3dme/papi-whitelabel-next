import { PageShell } from "@/components/PageShell";
import { bookingRepository } from "@/lib/data/repository";
import { formatPrice } from "@/lib/format";

export default async function BookingPage() {
  const [services, employees] = await Promise.all([
    bookingRepository.listServices(),
    bookingRepository.listEmployees(),
  ]);

  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">Customer booking</p>
        <h1>Vyberte službu a termín</h1>
        <p className="lead">
          Mock flow for a fast white-label prototype. Replace repository data with Supabase
          queries when production auth and writes are ready.
        </p>
      </section>

      <section className="booking-layout">
        <div className="card stack">
          <h2>Služby</h2>
          <div className="list">
            {services.map((service) => (
              <div className="list-row" key={service.id}>
                <div>
                  <strong>{service.name}</strong>
                  <p className="muted">
                    {service.category} · {service.durationMinutes} min
                  </p>
                </div>
                <strong>{formatPrice(service.priceCents)}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className="card soft stack">
          <h2>Tím</h2>
          {employees.map((employee) => (
            <div className="list-row" key={employee.id}>
              <span>{employee.name}</span>
              <span className="status">{employee.role}</span>
            </div>
          ))}
        </aside>
      </section>
    </PageShell>
  );
}
