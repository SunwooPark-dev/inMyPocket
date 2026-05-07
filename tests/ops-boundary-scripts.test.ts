import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ops evidence grant proof denies anon authenticated and public direct grants", () => {
  const script = readFileSync("scripts/collect-ops-evidence.ps1", "utf8");

  assert.match(
    script,
    /DeniedGrantees\s+@\("anon",\s*"authenticated",\s*"public"\)/
  );
});

test("focused published-view verifier treats public as a forbidden direct grantee", () => {
  const sql = readFileSync("scripts/verify-published-view-direct-grants.sql", "utf8");

  assert.match(sql, /grantee in \('anon', 'authenticated', 'public'\)/);
});

test("published-view hardening SQL revokes browser roles and preserves service-role reads", () => {
  const sql = readFileSync("scripts/harden-published-view-direct-grants.sql", "utf8");

  assert.match(sql, /revoke all privileges on table public\.published_price_observations from anon;/);
  assert.match(sql, /revoke all privileges on table public\.published_price_observations from authenticated;/);
  assert.match(sql, /revoke all privileges on table public\.published_price_observations from public;/);
  assert.match(sql, /grant select on table public\.published_price_observations to service_role;/);
  assert.match(sql, /to_regclass\('public\.published_price_observations'\)/);
});

test("ops evidence report uses sanitized Supabase proof output", () => {
  const script = readFileSync("scripts/collect-ops-evidence.ps1", "utf8");

  assert.match(script, /function Format-ReportOutput/);
  assert.match(script, /function Format-SupabaseReportOutput/);
  assert.doesNotMatch(script, /\$\(\$uiEvidenceResult\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$bootstrapResult\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$smokeResult\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$publicPolicies\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$publishedView\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$publishedViewGrants\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$evidenceBucket\.Output\)/);
  assert.doesNotMatch(script, /\$\(\$storagePolicies\.Output\)/);
});

test("live smoke direct-grant failure does not print raw REST response bodies", () => {
  const script = readFileSync("scripts/live-smoke.ps1", "utf8");

  assert.doesNotMatch(script, /throw "Direct publishable-key grant query returned HTTP \$publicRestStatus\. \$publicRows"/);
  assert.doesNotMatch(script, /\$saveError = if \(Test-Path \$saveResponsePath\)/);
  assert.doesNotMatch(script, /throw "POST \/api\/admin\/observations expected 200 but got \$saveCode\. \$saveError"/);
  assert.match(script, /Raw REST response body suppressed/);
});

test("boundary check rejects tracked local generated artifacts", () => {
  const script = readFileSync("scripts/check-boundaries.mjs", "utf8");

  assert.match(script, /execFileSync\("git", \["ls-files"\]/);
  assert.match(script, /\.ops-evidence is local\/generated and must not be tracked/);
  assert.match(script, /Supabase local CLI state must not be tracked/);
  assert.match(script, /\.env files must not be tracked/);
  assert.match(script, /temporary run logs\/artifacts must not be tracked/);
});

test("hardening handoff only references defined package scripts", () => {
  const handoff = readFileSync("scripts/show-hardening-handoff.ts", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const referencedScripts = [...handoff.matchAll(/pnpm ([a-z0-9:_-]+)/g)]
    .map((match) => match[1])
    .filter((scriptName): scriptName is string => Boolean(scriptName));

  assert.equal(referencedScripts.length > 0, true);
  for (const scriptName of referencedScripts) {
    assert.ok(packageJson.scripts[scriptName], `${scriptName} must be defined in package.json`);
  }
  assert.match(handoff, /pnpm ops:show-supabase-sql/);
  assert.match(handoff, /pnpm smoke:public/);
});

test("hardening docs only reference defined package scripts", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const pnpmBuiltIns = new Set(["dlx", "install"]);
  const docs = [
    "README.md",
    "docs/wiki/hardening-state.md",
    "docs/wiki/hardening-execution-graph.md",
    "docs/operator-evidence-bundle.md"
  ];

  for (const docPath of docs) {
    const source = readFileSync(docPath, "utf8");
    const referencedScripts = [...source.matchAll(/pnpm ([a-z0-9:_-]+)/g)]
      .map((match) => match[1])
      .filter((scriptName): scriptName is string => Boolean(scriptName));

    for (const scriptName of referencedScripts) {
      if (pnpmBuiltIns.has(scriptName)) {
        continue;
      }

      assert.ok(packageJson.scripts[scriptName], `${scriptName} in ${docPath} must be defined in package.json`);
    }
  }
});

test("local preflight runs the hardening quality gates in order", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const preflight = packageJson.scripts["ops:local-preflight"] ?? "";

  assert.match(preflight, /pnpm boundary:check/);
  assert.match(preflight, /pnpm secret:check/);
  assert.match(preflight, /pnpm typecheck/);
  assert.match(preflight, /pnpm lint/);
  assert.match(preflight, /pnpm test/);
  assert.match(preflight, /pnpm build/);
  assert.ok(preflight.indexOf("pnpm boundary:check") < preflight.indexOf("pnpm secret:check"));
  assert.ok(preflight.indexOf("pnpm secret:check") < preflight.indexOf("pnpm typecheck"));
  assert.ok(preflight.indexOf("pnpm typecheck") < preflight.indexOf("pnpm lint"));
  assert.ok(preflight.indexOf("pnpm lint") < preflight.indexOf("pnpm test"));
  assert.ok(preflight.indexOf("pnpm test") < preflight.indexOf("pnpm build"));
});

test("Supabase SQL handoff references hardening and verification files safely", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const script = readFileSync("scripts/show-supabase-sql-handoff.ts", "utf8");

  assert.ok(packageJson.scripts["ops:show-supabase-sql"]);
  assert.match(script, /harden-published-view-direct-grants\.sql/);
  assert.match(script, /verify-published-view-direct-grants\.sql/);
  assert.match(script, /pnpm ops:harden-published-view:verify/);
  assert.match(script, /forbidden_direct_grant_count = 0/);
  assert.match(script, /service_role_select_grant_count = 1/);
  assert.doesNotMatch(script, /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|Authorization|apikey/);
});

test("published-view status command is non-applying and safe", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const script = readFileSync("scripts/harden-published-view-direct-grants.ps1", "utf8");

  assert.match(packageJson.scripts["ops:harden-published-view:status"] ?? "", /-Status/);
  assert.match(script, /\[switch\]\$Status/);
  assert.match(script, /Supabase project is not linked/);
  assert.match(script, /STATUS  direct-grant proof passed/);
  assert.ok(script.indexOf("if ($Status)") < script.indexOf("if ($Apply)"));
  assert.match(script, /if \(\$Status\) \{\s*Invoke-LinkedSupabaseSqlStatus[\s\S]*?exit 0\s*\}/);
});

test("hosted ops artifact upload uses explicit safe evidence allowlist", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

  assert.doesNotMatch(workflow, /^\s*\.ops-evidence\/ops-evidence-\*\/\s*$/m);
  assert.doesNotMatch(workflow, /^\s*\.ops-evidence\/visual-regression-\*\/\s*$/m);
  assert.match(workflow, /\.ops-evidence\/ops-evidence-\*\/report\.md/);
  assert.match(workflow, /\.ops-evidence\/ops-evidence-\*\/manifest\.json/);
  assert.match(workflow, /\.ops-evidence\/ops-evidence-\*\/ui-assets\/\*\.png/);
  assert.match(workflow, /\.ops-evidence\/ops-evidence-\*\/ui-assets\/\*\.pdf/);
  assert.match(workflow, /\.ops-evidence\/visual-regression-\*\/visual-regression\.json/);
  assert.match(workflow, /\.ops-evidence\/visual-regression-\*\/visual-regression\.md/);
  assert.match(workflow, /\.ops-evidence\/visual-regression-\*\/\*\.diff\.png/);
});

test("public smoke stays public-only and covers pilot routes", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const script = readFileSync("scripts/public-smoke.ps1", "utf8");

  assert.ok(packageJson.scripts["smoke:public"]);
  assert.match(script, /\$env:APP_URL/);
  assert.match(script, /\?zip=30328&scenario=base_regular_total/);
  assert.match(script, /\?zip=30022&scenario=base_regular_total/);
  assert.match(script, /\/printable\?zip=30022&scenario=base_regular_total/);
  assert.match(script, /\?zip=99999&scenario=base_regular_total/);
  assert.doesNotMatch(script, /\/api\/admin|ADMIN_ACCESS_TOKEN|Cookie:|published_price_observations|SUPABASE_SERVICE_ROLE_KEY/);
});

test("3109 preview scripts match the current local browser lane", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };

  assert.match(packageJson.scripts["start:3109"] ?? "", /-Mode start -Port 3109/);
  assert.match(packageJson.scripts["smoke:public:3109"] ?? "", /APP_URL=http:\/\/localhost:3109|BaseUrl http:\/\/localhost:3109/);
  assert.match(packageJson.scripts["smoke:public:3109"] ?? "", /public-smoke\.ps1/);
});

test("Codex bootstrap captures the autonomous coding task key", () => {
  const bootstrap = readFileSync("docs/codex-operator-bootstrap.md", "utf8");

  assert.match(bootstrap, /## Codex Key for Coding Tasks/);
  assert.match(bootstrap, /Explore the codebase first/);
  assert.match(bootstrap, /Run independent discovery in parallel when possible/);
  assert.match(bootstrap, /Diagnose the root cause before editing/);
  assert.match(bootstrap, /internal checklist/);
  assert.match(bootstrap, /If verification fails, inspect the failure, make one focused fix, and rerun/);
});
