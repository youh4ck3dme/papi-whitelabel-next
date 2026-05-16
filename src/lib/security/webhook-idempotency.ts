const SEEN_EVENT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_EVENTS = 5000;

type SeenEventMap = Map<string, number>;

declare global {
  // eslint-disable-next-line no-var
  var __stripeWebhookSeenEvents: SeenEventMap | undefined;
}

function getStore(): SeenEventMap {
  if (!globalThis.__stripeWebhookSeenEvents) {
    globalThis.__stripeWebhookSeenEvents = new Map<string, number>();
  }

  return globalThis.__stripeWebhookSeenEvents;
}

function pruneStore(store: SeenEventMap, now: number) {
  for (const [eventId, expiresAt] of store.entries()) {
    if (expiresAt <= now) {
      store.delete(eventId);
    }
  }

  if (store.size <= MAX_TRACKED_EVENTS) {
    return;
  }

  const sortedByExpiry = [...store.entries()].sort((a, b) => a[1] - b[1]);
  const deleteCount = store.size - MAX_TRACKED_EVENTS;

  for (let i = 0; i < deleteCount; i += 1) {
    const [eventId] = sortedByExpiry[i] ?? [];
    if (eventId) {
      store.delete(eventId);
    }
  }
}

export function claimWebhookEventId(eventId: string) {
  const now = Date.now();
  const store = getStore();

  pruneStore(store, now);

  const existingExpiry = store.get(eventId);
  if (existingExpiry && existingExpiry > now) {
    return { firstSeen: false as const };
  }

  store.set(eventId, now + SEEN_EVENT_TTL_MS);
  return { firstSeen: true as const };
}
