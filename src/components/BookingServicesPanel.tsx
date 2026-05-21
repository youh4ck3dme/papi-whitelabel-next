"use client";

import { useMemo, useState } from "react";
import type { Service } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { useOfflineStatus } from "@/lib/useOfflineStatus";

type BookingServicesPanelProps = {
  services: Service[];
};

export function BookingServicesPanel({ services }: BookingServicesPanelProps) {
  const isOffline = useOfflineStatus();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return services;
    const lower = query.trim().toLowerCase();
    return services.filter((service) => {
      const haystack = `${service.name} ${service.category}`.toLowerCase();
      return haystack.includes(lower);
    });
  }, [query, services]);

  return (
    <div className="card stack">
      <h2>Služby</h2>
      <input
        aria-label="Search services"
        className={`search-bar ${isOffline ? "search-bar-offline" : ""}`}
        disabled={isOffline}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={isOffline ? "Offline režim: vyhľadávanie nedostupné" : "Hľadať službu"}
        type="search"
        value={query}
      />
      <div className="list">
        {filtered.map((service) => (
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
        {filtered.length === 0 ? (
          <p className="muted">Nenašli sa žiadne služby pre zadaný výraz.</p>
        ) : null}
      </div>
    </div>
  );
}
