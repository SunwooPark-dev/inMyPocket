import { execFileSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { logger } from "./logger.mjs";

const projectRoot = process.cwd();
const scanRoots = ["src", "scripts", "tests", "docs", "README.md"];
const violations = [];
const ignoredRelativePaths = new Set([
  path.normalize("scripts/check-boundaries.mjs")
]);
const allowedTrackedLocalArtifacts = new Set([".env.example"]);
const forbiddenTrackedPathPatterns = [
  { pattern: /^\.env(?:$|\.)/, message: ".env files must not be tracked; keep secrets local." },
  { pattern: /^\.ops-evidence(?:\/|$)/, message: ".ops-evidence is local/generated and must not be tracked." },
  { pattern: /^\.omx(?:\/|$)/, message: ".omx is local/generated and must not be tracked." },
  { pattern: /^\.sisyphus(?:\/|$)/, message: ".sisyphus is local/generated and must not be tracked." },
  { pattern: /^\.tools(?:\/|$)/, message: ".tools is local/generated and must not be tracked." },
  { pattern: /^\.tmp-gh-artifact/, message: "temporary GitHub artifact directories must not be tracked." },
  { pattern: /^\.smoke-debug-/, message: "smoke debug artifacts must not be tracked." },
  { pattern: /^supabase\/\.temp(?:\/|$)/, message: "Supabase local CLI state must not be tracked." },
  { pattern: /^tmp-.*/, message: "temporary run logs/artifacts must not be tracked." },
  { pattern: /(^|\/).*\.stdout\.log$/, message: "stdout logs must not be tracked." },
  { pattern: /(^|\/).*\.stderr\.log$/, message: "stderr logs must not be tracked." },
  { pattern: /^dev.*\.log$/, message: "local dev logs must not be tracked." },
  { pattern: /^next-start\..*\.log$/, message: "local Next.js start logs must not be tracked." }
];

function shouldIgnore(filePath) {
  const relativePath = path.normalize(path.relative(projectRoot, filePath));

  if (ignoredRelativePaths.has(relativePath)) {
    return true;
  }

  return /docs[\\/]+hosted-proof-observation.*\.md$/i.test(relativePath);
}

async function walk(targetPath) {
  const absolutePath = path.join(projectRoot, targetPath);
  const targetStat = await stat(absolutePath);

  if (targetStat.isFile()) {
    return [absolutePath];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childPath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path.relative(projectRoot, childPath))));
      continue;
    }

    files.push(childPath);
  }

  return files;
}

function addViolation(filePath, message) {
  violations.push(`${path.relative(projectRoot, filePath)}: ${message}`);
}

function addPathViolation(relativePath, message) {
  violations.push(`${relativePath}: ${message}`);
}

function getTrackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function checkTrackedLocalArtifacts() {
  for (const trackedPath of getTrackedFiles()) {
    const normalizedPath = trackedPath.replace(/\\/g, "/");

    if (allowedTrackedLocalArtifacts.has(normalizedPath)) {
      continue;
    }

    const violation = forbiddenTrackedPathPatterns.find(({ pattern }) => pattern.test(normalizedPath));
    if (violation) {
      addPathViolation(normalizedPath, violation.message);
    }
  }
}

function isClientComponent(source, filePath) {
  if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) {
    return false;
  }

  const lines = source.split(/\r?\n/, 6);
  return lines.some((line) => line.trim() === '"use client";' || line.trim() === "'use client';");
}

function checkFile(filePath, source) {
  if (shouldIgnore(filePath)) {
    return;
  }

  const relativePath = path.normalize(path.relative(projectRoot, filePath));

  if (source.includes("/api/observations")) {
    addViolation(filePath, "legacy /api/observations path is forbidden; use /api/admin/observations.");
  }

  if (source.includes("getSupabasePublicClient")) {
    addViolation(filePath, "getSupabasePublicClient must not be used.");
  }

  if (source.includes("/api/founding-member/checkout")) {
    addViolation(filePath, "direct payment checkout route is not part of the active product model.");
  }

  if (source.includes("/api/stripe/webhook")) {
    addViolation(filePath, "Stripe webhook route is not part of the active product model.");
  }

  if (
    /getPublicEffectiveObservations\s*}\s*from\s*["'][^"']*server-storage["']/.test(source) ||
    /readPublicStoredObservations\s*}\s*from\s*["'][^"']*server-storage["']/.test(source)
  ) {
    addViolation(filePath, "public published reads must not come from the mixed server-storage barrel.");
  }

  if (
    filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}waitlist${path.sep}`) &&
    /from\s*["'][^"']*server-storage["']/.test(source)
  ) {
    addViolation(filePath, "active waitlist routes must use waitlist-storage, not the mixed server-storage barrel.");
  }

  if (
    (filePath.includes(`${path.sep}src${path.sep}app${path.sep}admin${path.sep}`) ||
      filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}admin${path.sep}`)) &&
    /from\s*["'][^"']*server-storage["']/.test(source)
  ) {
    addViolation(filePath, "active admin routes must use admin-observation-storage, not the mixed server-storage barrel.");
  }

  if (
    (filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}waitlist${path.sep}`) ||
      filePath.includes(`${path.sep}src${path.sep}lib${path.sep}waitlist`)) &&
    /from\s*["'][^"']*founding-member-storage["']/.test(source)
  ) {
    addViolation(filePath, "active waitlist code must use waitlist-storage instead of founding-member-storage.");
  }

  if (
    relativePath !== path.normalize("src/lib/domain.ts") &&
    (source.includes("FoundingMemberSignup") || source.includes("FoundingMemberSignupStatus"))
  ) {
    addViolation(filePath, "FoundingMemberSignup* naming is legacy-only and must not appear outside explicit historical compatibility context.");
  }

  if (
    isClientComponent(source, filePath) &&
    /from\s*["'][^"']*(public-observation-server|observation-repository|server-storage)["']/.test(source)
  ) {
    addViolation(filePath, "client components must not import server-owned observation modules.");
  }

  if (
    filePath.endsWith(`${path.sep}src${path.sep}app${path.sep}page.tsx`) ||
    filePath.endsWith(`${path.sep}src${path.sep}app${path.sep}printable${path.sep}page.tsx`)
  ) {
    if (!source.includes('from "../lib/public-observation-server"') &&
        !source.includes('from "../../lib/public-observation-server"')) {
      addViolation(filePath, "public basket pages must import public-observation-server.");
    }
  }

  if (
    filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}founding-member${path.sep}`) ||
    filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}stripe${path.sep}`) ||
    filePath.includes(`${path.sep}src${path.sep}app${path.sep}founding-member${path.sep}`)
  ) {
    addViolation(filePath, "dormant payment runtime files must not be reintroduced.");
  }
}

async function main() {
  checkTrackedLocalArtifacts();

  const files = [];

  for (const root of scanRoots) {
    files.push(...(await walk(root)));
  }

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    checkFile(filePath, source);
  }

  if (violations.length > 0) {
    console.error("Boundary check failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  logger.info("Boundary check passed.");
}

await main();
