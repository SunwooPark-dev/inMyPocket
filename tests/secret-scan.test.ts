import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

type SecretFinding = {
  path: string;
  line: number;
  type: string;
};

const { findSecretFindings } = await import(pathToFileURL("scripts/check-secrets.mjs").href) as {
  findSecretFindings(files: Array<{ path: string; source: string }>): SecretFinding[];
};

const githubTokenFixture = ["github", "pat", "1234567890abcdef1234567890abcdef123456"].join("_");
const stripeSecretKeyFixture = ["sk", "live", "1234567890abcdef1234567890"].join("_");
const privateKeyBlockFixture = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
const serviceRoleKeyFixture = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "fake"
].join(".");

test("secret scan allows empty env examples and placeholders", () => {
  const findings = findSecretFindings([
    {
      path: ".env.example",
      source: [
        "SUPABASE_SERVICE_ROLE_KEY=",
        "OPENAI_API_KEY=your-key-here",
        "STRIPE_SECRET_KEY=<stripe-secret-key>"
      ].join("\n")
    }
  ]);

  assert.deepEqual(findings, []);
});

test("secret scan flags common committed secret patterns", () => {
  const findings = findSecretFindings([
    {
      path: "docs/bad.md",
      source: [
        githubTokenFixture,
        ["STRIPE_SECRET_KEY", stripeSecretKeyFixture].join("="),
        privateKeyBlockFixture
      ].join("\n")
    }
  ]);

  assert.equal(findings.length, 3);
  assert.deepEqual(
    findings.map((finding) => finding.type),
    ["github-token", "stripe-secret-key", "private-key-block"]
  );
});

test("secret scan flags long sensitive env assignments", () => {
  const findings = findSecretFindings([
    {
      path: "scripts/example.ps1",
      source: ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKeyFixture].join("=")
    }
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.type, "SUPABASE_SERVICE_ROLE_KEY assignment");
});
