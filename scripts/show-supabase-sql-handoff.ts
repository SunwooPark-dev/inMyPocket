import { logger } from "./logger.ts";

const lines = [
  "Supabase SQL Handoff",
  "",
  "Use this when the Supabase CLI is not linked but SQL Editor access is available.",
  "",
  "Files to open:",
  "1. scripts/harden-published-view-direct-grants.sql",
  "2. scripts/verify-published-view-direct-grants.sql",
  "",
  "Execution order:",
  "1. Paste and run scripts/harden-published-view-direct-grants.sql in the linked Supabase SQL Editor.",
  "2. Paste and run scripts/verify-published-view-direct-grants.sql in the same project.",
  "3. Optional CLI verification if the project is linked: pnpm ops:harden-published-view:verify.",
  "4. Run pnpm smoke:local -SkipPayment from the repo.",
  "5. Run pnpm ops:evidence and pnpm ops:verify after smoke passes.",
  "",
  "Expected verification:",
  "- forbidden_direct_grant_count = 0",
  "- service_role_select_grant_count = 1",
  "- Direct browser/publishable-key reads are denied or return zero governed rows.",
  "- App-server reads still render the pilot basket.",
  "",
  "Safety rules:",
  "- Do not paste runtime keys into chat, docs, issues, PRs, or terminal transcripts.",
  "- Do not share raw REST response bodies or service-role values.",
  "- Share only sanitized command results, expected counts, or hosted CI artifact links."
];

logger.info(lines.join("\n"));

export {};
