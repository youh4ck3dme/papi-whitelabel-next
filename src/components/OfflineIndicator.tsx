"use client";

import { useOfflineStatus } from "@/lib/useOfflineStatus";

export function OfflineIndicator() {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <span
      aria-label="Offline mode"
      className="offline-indicator"
      role="status"
      title="Offline mode: search will not work"
    />
  );
}
