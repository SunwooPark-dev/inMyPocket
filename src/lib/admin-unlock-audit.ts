const MAX_INCIDENTS = 10;

export type AdminUnlockIncident = {
  occurredAt: string;
  eventType: "success" | "invalid_token" | "throttled";
  clientKey: string;
  attempts: number | null;
  remainingAttempts: number | null;
  retryAfterSeconds: number | null;
};

type AdminUnlockIncidentStore = AdminUnlockIncident[];

declare global {
  var __inmypoketAdminUnlockIncidents: AdminUnlockIncidentStore | undefined;
}

const incidentStore: AdminUnlockIncidentStore =
  globalThis.__inmypoketAdminUnlockIncidents ??
  (globalThis.__inmypoketAdminUnlockIncidents = []);

export function recordAdminUnlockIncident(
  input: Omit<AdminUnlockIncident, "occurredAt">
) {
  incidentStore.unshift({
    occurredAt: new Date().toISOString(),
    ...input
  });

  if (incidentStore.length > MAX_INCIDENTS) {
    incidentStore.length = MAX_INCIDENTS;
  }
}

export function readRecentAdminUnlockIncidents() {
  return [...incidentStore];
}

export function clearAdminUnlockIncidents() {
  incidentStore.length = 0;
}
