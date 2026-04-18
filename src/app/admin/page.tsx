import Link from "next/link";

import { isAdminAuthorized } from "../../lib/admin-auth";
import { readRecentAdminUnlockIncidents } from "../../lib/admin-unlock-audit";
import { AdminPreviewForm } from "../../components/admin-preview-form";
import { AdminUnlockForm } from "../../components/admin-unlock-form";
import { DAILY_RUNBOOK, PUBLISH_GATES, SOURCE_GOVERNANCE } from "../../lib/catalog";
import { appEnv, isPaymentFlowEnabled, isSupabaseConfigured, isStripeConfigured, monetizationModel } from "../../lib/env";
import {
  readLatestHostedOpsAttestationSummary,
  readLatestOpsEvidenceSummary,
  readLatestOperatorProofSummary,
  readLatestReleaseHealthSummary,
  readLatestVisualRegressionSummary
} from "../../lib/ops-evidence";
import { getRecentStoredObservations } from "../../lib/server-storage";
import { SectionCard } from "../../components/section-card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const unlocked = await isAdminAuthorized();
  const releaseHealth = unlocked ? await readLatestReleaseHealthSummary() : null;
  const latestOpsEvidence = unlocked ? await readLatestOpsEvidenceSummary() : null;
  const operatorProof = unlocked ? await readLatestOperatorProofSummary() : null;
  const hostedAttestation = unlocked ? await readLatestHostedOpsAttestationSummary() : null;
  const visualRegression = unlocked ? await readLatestVisualRegressionSummary() : null;
  const recentUnlockIncidents = unlocked ? readRecentAdminUnlockIncidents() : [];
  const recentObservations =
    unlocked && isSupabaseConfigured() ? await getRecentStoredObservations() : [];
  const readinessItems = [
    ["NEXT_PUBLIC_SUPABASE_URL", Boolean(appEnv.supabaseUrl)],
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", Boolean(appEnv.supabasePublishableKey)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(appEnv.supabaseServiceRoleKey)],
    ["STRIPE_SECRET_KEY", Boolean(appEnv.stripeSecretKey)],
    ["STRIPE_WEBHOOK_SECRET", Boolean(appEnv.stripeWebhookSecret)],
    ["STRIPE_PRICE_ID_FOUNDING_MEMBER", Boolean(appEnv.stripePriceIdFoundingMember)],
    ["APP_URL", Boolean(appEnv.appUrl)],
    ["ADMIN_ACCESS_TOKEN", Boolean(appEnv.adminAccessToken)],
    ["ADMIN_SESSION_SECRET", Boolean(appEnv.adminSessionSecret)]
  ] as const;

  return (
    <main className="page-shell">
      <section className="hero hero--compact">
        <div className="hero__content">
          <p className="hero__eyebrow">Operator console</p>
          <h1>Manual entry and publish-gate QA</h1>
          <p className="hero__lede">
            This screen previews how a manually validated public price record will normalize into the
            20-item basket and whether it passes the MVP publish rules.
          </p>
          <AdminUnlockForm unlocked={unlocked} />
        </div>
      </section>

      {!unlocked ? (
        <SectionCard eyebrow="Locked" title="Admin access required">
          <p className="hero__lede">
            Unlock the admin console with `ADMIN_ACCESS_TOKEN` to save observations, upload evidence,
            or open evidence downloads.
          </p>
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Preview input" title="Manual observation preview">
          <AdminPreviewForm canSave={isSupabaseConfigured()} />
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Integration status" title="Runtime readiness">
          <div className="badge-row">
            <span className={`pill ${isSupabaseConfigured() ? "pill--good" : "pill--warn"}`}>
              Supabase {isSupabaseConfigured() ? "ready" : "missing config"}
            </span>
            <span className="pill pill--quiet">
              Monetization {monetizationModel}
            </span>
            <span className={`pill ${isPaymentFlowEnabled() ? "pill--good" : "pill--warn"}`}>
            Checkout {isPaymentFlowEnabled() ? "enabled" : "inactive"}
          </span>
          <span
            className={`pill ${
              appEnv.adminAccessToken && appEnv.adminSessionSecret ? "pill--good" : "pill--warn"
            }`}
          >
            Admin auth{" "}
            {appEnv.adminAccessToken && appEnv.adminSessionSecret ? "ready" : "missing config"}
          </span>
        </div>
          <ul className="compact-list">
            {readinessItems.map(([label, ready]) => (
              <li key={label}>
                {label}: {ready ? "SET" : "MISSING"}
              </li>
            ))}
          </ul>
          <p className="hero__lede">
            Live smoke helper: run `scripts/bootstrap-local.ps1`. Direct payment is not part of the current product model, so Stripe forwarding is only relevant if the business model changes in the future.
          </p>
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Blocked by" title="External blockers">
          <ul className="compact-list">
            {(operatorProof?.externalBlockers ?? []).map((blocker) => (
              <li key={blocker.key}>
                [{blocker.severity.toUpperCase()}] {blocker.title}: {blocker.detail} Unblock by:{" "}
                {blocker.unblockRequirement}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Hand off" title="External proof handoff">
          <p className="hero__lede">
            Dedicated handoff files: {operatorProof?.artifactPointers.externalProofHandoffJsonPath} and{" "}
            {operatorProof?.artifactPointers.externalProofHandoffMarkdownPath}
          </p>
          <ul className="compact-list">
            {(operatorProof?.externalProofHandoff ?? []).map((item) => (
              <li key={item.key}>
                {item.title}: {item.blocker} Required inputs: {item.requiredInputs.join(" ; ")}. Expected
                outputs: {item.expectedOutputs.join(" ; ")}.
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Do this next" title="Operator next actions">
          <ul className="compact-list">
            {(operatorProof?.nextActions ?? []).map((action) => (
              <li key={action.key}>
                [{action.priority.toUpperCase()}] {action.title}: {action.reason} Commands:{" "}
                {action.commands.join(" ; ")}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Current milestone" title="Release health">
          {releaseHealth ? (
            <>
              <div className="badge-row">
                <span className={`pill ${releaseHealth.verdict === "green" ? "pill--good" : "pill--warn"}`}>
                  Verdict {releaseHealth.verdict.toUpperCase()}
                </span>
                <span className="pill pill--quiet">Proof {releaseHealth.proofLabel}</span>
                <span className={`pill ${releaseHealth.freshnessStatus === "stale" ? "pill--warn" : "pill--quiet"}`}>
                  Freshness {releaseHealth.freshnessStatus}
                </span>
                <span className="pill pill--quiet">
                  Hosted {releaseHealth.hostedObservationStatus}
                </span>
                <span className="pill pill--quiet">Ops {releaseHealth.operationsProofStatus}</span>
                <span className="pill pill--quiet">
                  Live proof {releaseHealth.liveSupabaseProofStatus}
                </span>
                <span className={`pill ${releaseHealth.visualRegressionStatus === "red" ? "pill--warn" : "pill--quiet"}`}>
                  Visual {releaseHealth.visualRegressionStatus}
                </span>
                <span className="pill pill--quiet">Payment {releaseHealth.paymentStatus}</span>
              </div>
              <p className="hero__lede">
                Last verified {releaseHealth.formattedVerifiedAt}. Latest bundle: {releaseHealth.bundleName}
              </p>
              {hostedAttestation ? (
                <p className="hero__lede">
                  {hostedAttestation.provenanceLabel}: {hostedAttestation.formattedGeneratedAt}. Run{" "}
                  {hostedAttestation.workflowRunNumber}, commit {hostedAttestation.commitShaShort}. The
                  canonical verdict and proof scope come from release-health above.
                </p>
              ) : (
                <p className="hero__lede">
                  No hosted CI attestation is recorded yet. The current verdict is based on the latest local evidence bundle.
                </p>
              )}
              {visualRegression ? (
                <p className="hero__lede">
                  Latest visual regression {visualRegression.formattedGeneratedAt}. Verdict {visualRegression.verdict.toUpperCase()}
                  , threshold {visualRegression.threshold}, report {visualRegression.reportName}.
                </p>
              ) : (
                <p className="hero__lede">
                  No visual regression advisory result is recorded yet. Run `pnpm visual:check` to refresh it.
                </p>
              )}
              {releaseHealth.staleReasons.length > 0 ? (
                <>
                  <p className="hero__lede">Current stale-proof reasons:</p>
                  <ul className="compact-list">
                    {releaseHealth.staleReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {latestOpsEvidence ? (
                <ul className="compact-list">
                  {latestOpsEvidence.stepStatus.map((step) => (
                    <li key={step.key}>
                      {step.title}: {step.label}
                    </li>
                  ))}
                </ul>
              ) : null}
              {releaseHealth.errors.length > 0 ? (
                <>
                  <p className="hero__lede">Current release-health errors:</p>
                  <ul className="compact-list">
                    {releaseHealth.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="hero__lede">
                  No contract errors are currently recorded. Use `pnpm ops:evidence` and `pnpm ops:verify`
                  to refresh this status after meaningful changes.
                </p>
              )}
            </>
          ) : (
            <p className="hero__lede">
              No release-health verdict is available yet. Run `pnpm ops:evidence` and `pnpm ops:verify`
              to generate the latest operator proof state.
            </p>
          )}
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="What was proven" title="Operator evidence">
          {operatorProof ? (
            <>
              <div className="badge-row">
                <span className={`pill ${operatorProof.releaseHealthVerdict === "green" ? "pill--good" : "pill--warn"}`}>
                  Verdict {operatorProof.releaseHealthVerdict.toUpperCase()}
                </span>
                <span className="pill pill--quiet">Scope {operatorProof.proofLabel}</span>
                <span className="pill pill--quiet">Hosted {operatorProof.hostedObservationStatus}</span>
                <span className={`pill ${operatorProof.visualRegressionStatus === "red" ? "pill--warn" : "pill--quiet"}`}>
                  Visual {operatorProof.visualRegressionStatus}
                </span>
              </div>
              <p className="hero__lede">
                Generated {operatorProof.formattedGeneratedAt}. Latest bundle: {operatorProof.bundleName}
              </p>
              <ul className="compact-list">
                {operatorProof.items.map((item) => (
                  <li key={item.key}>
                    [{item.status.toUpperCase()}] {item.title}: {item.detail}
                  </li>
                ))}
              </ul>
              <p className="hero__lede">Refresh commands:</p>
              <ul className="compact-list">
                {operatorProof.refreshCommands.map((command) => (
                  <li key={command}>{command}</li>
                ))}
              </ul>
              <p className="hero__lede">Artifact pointers:</p>
              <ul className="compact-list">
                <li>Latest pointer: {operatorProof.artifactPointers.latestPointerPath}</li>
                <li>Release health JSON: {operatorProof.artifactPointers.releaseHealthJsonPath}</li>
                <li>Release health Markdown: {operatorProof.artifactPointers.releaseHealthMarkdownPath}</li>
                <li>Bundle: {operatorProof.artifactPointers.bundleDir ?? "missing"}</li>
                <li>Report: {operatorProof.artifactPointers.reportPath ?? "missing"}</li>
                <li>Manifest: {operatorProof.artifactPointers.manifestPath ?? "missing"}</li>
                <li>Visual report dir: {operatorProof.artifactPointers.visualReportDir ?? "missing"}</li>
              </ul>
            </>
          ) : (
            <p className="hero__lede">
              No operator-proof checklist is available yet. Run `pnpm ops:evidence` and `pnpm ops:verify`
              to generate the latest operator-facing checklist.
            </p>
          )}
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Route checklist" title="Access-control proof">
          {operatorProof ? (
            <ul className="compact-list">
              {operatorProof.items
                .filter((item) => item.key === "admin-access" || item.key === "observation-evidence")
                .map((item) => (
                  <li key={item.key}>
                    [{item.status.toUpperCase()}] {item.title}: {item.detail}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="hero__lede">
              No access-control checklist is available yet. Refresh the operator evidence first.
            </p>
          )}
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Current process" title="Recent unlock incidents">
          {recentUnlockIncidents.length > 0 ? (
            <>
              <p className="hero__lede">
                This is a local-runtime incident log for admin unlock attempts. It resets when the process restarts.
              </p>
              <ul className="compact-list">
                {recentUnlockIncidents.map((incident) => (
                  <li key={`${incident.occurredAt}-${incident.eventType}-${incident.clientKey}`}>
                    [{incident.eventType.toUpperCase()}] {incident.occurredAt} · attempts{" "}
                    {incident.attempts ?? "n/a"} · remaining {incident.remainingAttempts ?? "n/a"} · retry{" "}
                    {incident.retryAfterSeconds ?? "n/a"}s
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="hero__lede">
              No unlock incidents have been recorded in this runtime yet.
            </p>
          )}
        </SectionCard>
      ) : null}

      {unlocked ? (
        <SectionCard eyebrow="Known boundaries" title="Accepted local limits">
          <p className="hero__lede">
            These are the current local/runtime limits that are intentionally accepted in this environment.
          </p>
          <ul className="compact-list">
            {(operatorProof?.acceptedLimits ?? []).map((limit) => (
              <li key={limit.key}>
                [{limit.status.toUpperCase()}] {limit.title}: {limit.detail} Reopen when: {limit.reopenWhen}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <div className="content-grid">
        <SectionCard eyebrow="Allowed input" title="Source governance">
          <div className="two-column-list">
            <div>
              <h3>Allowed</h3>
              <ul className="compact-list">
                {SOURCE_GOVERNANCE.allowed.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Prohibited</h3>
              <ul className="compact-list">
                {SOURCE_GOVERNANCE.prohibited.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Daily rhythm" title="Runbook">
          <ul className="compact-list">
            {DAILY_RUNBOOK.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard eyebrow="Release guardrails" title="Publish gate">
        <ul className="compact-list">
          {PUBLISH_GATES.map((gate) => (
            <li key={gate}>{gate}</li>
          ))}
        </ul>
      </SectionCard>

      {unlocked ? (
        <SectionCard eyebrow="Saved live records" title="Recent stored observations">
          {recentObservations.length === 0 ? (
            <p className="hero__lede">No live manual observations stored yet. Saved records will appear here.</p>
          ) : (
            <div className="comparison-list">
              {recentObservations.map((observation) => (
                <article key={observation.id} className="comparison-row">
                  <div className="comparison-row__heading">
                    <h3>{observation.canonicalProductId}</h3>
                    <p>
                      {observation.storeId} · {observation.priceType} · {observation.collectedAt}
                    </p>
                  </div>
                  <div className="badge-row">
                    <span className="pill pill--quiet">${observation.priceAmount.toFixed(2)}</span>
                    <span className="pill pill--quiet">
                      {observation.measurementValue} {observation.measurementUnit}
                    </span>
                    <span className="pill pill--quiet">{observation.comparabilityGrade}</span>
                    {observation.evidenceId ? (
                      <Link className="pill pill--quiet" href={`/api/admin/evidence/${observation.evidenceId}`}>
                        Evidence: {observation.evidenceOriginalName ?? "download"}
                      </Link>
                    ) : (
                      <span className="pill pill--quiet">No evidence</span>
                    )}
                  </div>
                  <ul className="compact-list">
                    <li>{observation.sourceUrl}</li>
                    <li>{observation.notes ?? "No operator note"}</li>
                  </ul>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      ) : null}
    </main>
  );
}
