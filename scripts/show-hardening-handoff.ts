import { logger } from "./logger.ts";

const lines = [
  "Hardening Handoff",
  "",
  "Current blocker:",
  "- Supabase direct-grant boundary is not passed until the linked hosted project denies publishable-key direct reads.",
  "- This is an external Supabase state blocker, not a local app-code blocker.",
  "",
  "Role order:",
  "1. Supabase Boundary Operator: apply and verify published-view direct-grant hardening in the linked Supabase project.",
  "2. Local Proof Verifier: rerun local smoke and ops evidence after Supabase proof is supplied.",
  "3. Docs/Handoff Reconciler: refresh generated proof artifacts and reconcile stale docs after verification passes.",
  "",
  "Run in a linked Supabase environment:",
  "1. pnpm ops:local-preflight",
  "2. pnpm smoke:public",
  "3. pnpm ops:harden-published-view:status",
  "4. pnpm ops:harden-published-view",
  "5. pnpm ops:harden-published-view:apply",
  "6. pnpm smoke:local -SkipPayment",
  "7. pnpm ops:evidence",
  "8. pnpm ops:verify",
  "",
  "If Supabase CLI is not linked but SQL Editor access exists:",
  "- pnpm ops:show-supabase-sql",
  "",
  "Expected proof:",
  "- forbidden_direct_grant_count = 0",
  "- service_role_select_grant_count = 1",
  "- publishable-key direct REST reads are denied or return zero governed rows",
  "- app-server/service-role public basket reads still render the pilot basket",
  "",
  "Safety rules:",
  "- Do not print or share Supabase keys, raw REST headers, raw REST response bodies, or service-role values.",
  "- Do not commit .ops-evidence, browser profiles, screenshots, PDFs, tmp logs, or non-example .env files.",
  "- Use pnpm ops:handoff or hosted CI artifact links for external handoff."
];

logger.info(lines.join("\n"));

export {};
