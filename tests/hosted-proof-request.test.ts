import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const VERIFY_SCRIPT = resolve(process.cwd(), "scripts/verify-ops-evidence.ts");

test("ops verify writes a hosted proof request packet when hosted proof is still blocked", () => {
  const tmp = mkdtempSync(join(tmpdir(), "inmypoket-hosted-request-"));

  try {
    const evidenceDir = join(tmp, ".ops-evidence");
    mkdirSync(evidenceDir, { recursive: true });

    writeFileSync(
      join(evidenceDir, "latest-run.json"),
      JSON.stringify({
        generatedAt: "2026-04-16T08:53:11.9219260-07:00",
        bundleDir: ".ops-evidence/ops-evidence-20260416-085253",
        reportPath: ".ops-evidence/ops-evidence-20260416-085253/report.md",
        uiAssetsDir: ".ops-evidence/ops-evidence-20260416-085253/ui-assets",
        manifestPath: ".ops-evidence/ops-evidence-20260416-085253/manifest.json",
        operationsProofStatus: "materially complete",
        paymentStatus: "not_planned",
        liveSupabaseProofStatus: "passed",
        stepStatus: {
          bootstrap: { succeeded: true, label: "PASS" },
          uiEvidence: { succeeded: true, label: "passed" },
          localSmoke: { succeeded: true, label: "PASS" },
          liveSupabaseProof: { succeeded: true, label: "passed" }
        }
      }),
      "utf8"
    );

    mkdirSync(join(evidenceDir, "ops-evidence-20260416-085253", "ui-assets"), { recursive: true });
    writeFileSync(join(evidenceDir, "ops-evidence-20260416-085253", "report.md"), "# report\n", "utf8");
    writeFileSync(
      join(evidenceDir, "ops-evidence-20260416-085253", "manifest.json"),
      JSON.stringify({
        generatedAt: "2026-04-16T08:53:11.9219260-07:00",
        publicUxStatus: "stable",
        operationsProofStatus: "materially complete",
        paymentStatus: "not_planned",
        paymentReady: false,
        bundleDir: ".ops-evidence/ops-evidence-20260416-085253",
        reportPath: ".ops-evidence/ops-evidence-20260416-085253/report.md",
        uiAssetsDir: ".ops-evidence/ops-evidence-20260416-085253/ui-assets",
        stepStatus: {
          bootstrap: { succeeded: true, label: "PASS" },
          uiEvidence: { succeeded: true, label: "passed" },
          localSmoke: { succeeded: true, label: "PASS" },
          liveSupabaseProof: { succeeded: true, label: "passed" }
        },
        envReadiness: {
          requiredNow: {},
          payment: {}
        }
      }),
      "utf8"
    );
    for (const asset of ["home-desktop.png", "home-mobile.png", "printable-mobile.png", "printable.pdf"]) {
      writeFileSync(join(evidenceDir, "ops-evidence-20260416-085253", "ui-assets", asset), "x", "utf8");
    }

    writeFileSync(
      join(evidenceDir, "hosted-attestation.json"),
      JSON.stringify({
        commitSha: "08906747d29dffde555322b17bf4fe2e3d7d4ba7",
        workflowRunId: "123",
        generatedAt: "2026-04-16T09:17:19.102Z",
        verdict: "green",
        proofLevel: "full",
        verificationScope: "local-simulated",
        operationsProofStatus: "materially complete",
        liveSupabaseProofStatus: "passed",
        paymentStatus: "not_planned",
        environment: "local-simulation"
      }),
      "utf8"
    );

    writeFileSync(
      join(evidenceDir, "hosted-proof-observation.json"),
      JSON.stringify({
        recordedAt: "2026-04-17T04:59:36.440Z",
        repo: "SunwooPark-dev/inMyPocket",
        branch: "main",
        localHead: "08906747d29dffde555322b17bf4fe2e3d7d4ba7",
        result: "blocked",
        blockerType: "remote_workflow_mismatch",
        summary:
          "No observed hosted run was found for local HEAD, and the remote default-branch workflow currently visible through GitHub does not match the local hosted proof lane."
      }),
      "utf8"
    );

    execFileSync(process.execPath, ["--experimental-strip-types", VERIFY_SCRIPT], {
      cwd: tmp,
      stdio: "pipe"
    });

    const request = JSON.parse(
      readFileSync(join(evidenceDir, "hosted-proof-request.json"), "utf8")
    ) as {
      request: string;
      preferredInputOrder: string[];
      acceptIf: string[];
      rejectIf: string[];
      closeCondition: string;
    };

    assert.match(request.request, /canonical GitHub-hosted proof run/i);
    assert.equal(request.preferredInputOrder[0], "Workflow run URL");
    assert.match(request.acceptIf[1], /LATEST\.md/i);
    assert.match(request.rejectIf[0], /build-only CI workflow/i);
    assert.match(request.closeCondition, /Hosted proof closes only when/i);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
