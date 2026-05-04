#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { logger } from "./logger.mjs";

const SECRET_ASSIGNMENT_KEYS = [
  "ADMIN_ACCESS_TOKEN",
  "ADMIN_SESSION_SECRET",
  "ANTHROPIC_API_KEY",
  "GITHUB_TOKEN",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OPENAI_API_KEY",
  "STRIPE_PRICE_ID_FOUNDING_MEMBER",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY"
];

const SECRET_PATTERNS = [
  {
    name: "private-key-block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/
  },
  {
    name: "github-token",
    pattern: /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})\b/
  },
  {
    name: "stripe-secret-key",
    pattern: /\b(?:sk_live|sk_test)_[A-Za-z0-9]{16,}\b/
  },
  {
    name: "openai-style-api-key",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/
  },
  {
    name: "google-api-key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/
  },
  {
    name: "aws-access-key-id",
    pattern: /\bAKIA[0-9A-Z]{16}\b/
  }
];

const PLACEHOLDER_VALUES = new Set([
  "",
  "changeme",
  "example",
  "fake",
  "missing",
  "not_set",
  "placeholder",
  "set",
  "test",
  "todo",
  "xxx",
  "your-key-here"
]);

const SECRET_ASSIGNMENT_PATTERN = new RegExp(
  `\\b(${SECRET_ASSIGNMENT_KEYS.join("|")})\\s*[:=]\\s*["']?([^"'\\s#]+)`,
  "i"
);

function isLikelyPlaceholder(value) {
  const normalized = value.trim().replace(/^["']|["']$/g, "").toLowerCase();

  if (PLACEHOLDER_VALUES.has(normalized)) {
    return true;
  }

  return (
    normalized.startsWith("<") ||
    normalized.startsWith("ci-") ||
    normalized.startsWith("test-") ||
    normalized.includes("your_") ||
    normalized.includes("example")
  );
}

function isTextContent(source) {
  return !source.includes("\u0000");
}

export function findSecretFindings(files) {
  const findings = [];

  for (const file of files) {
    if (!isTextContent(file.source)) {
      continue;
    }

    const lines = file.source.split(/\r?\n/);
    lines.forEach((line, index) => {
      let lineHasPatternFinding = false;

      for (const detector of SECRET_PATTERNS) {
        if (detector.pattern.test(line)) {
          lineHasPatternFinding = true;
          findings.push({
            path: file.path,
            line: index + 1,
            type: detector.name
          });
        }
      }

      const assignment = line.match(SECRET_ASSIGNMENT_PATTERN);
      if (
        assignment &&
        !lineHasPatternFinding &&
        assignment[2].length >= 12 &&
        !isLikelyPlaceholder(assignment[2])
      ) {
        findings.push({
          path: file.path,
          line: index + 1,
          type: `${assignment[1]} assignment`
        });
      }
    });
  }

  return findings;
}

function getTrackedFiles() {
  return execFileSync("git", ["ls-files"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  })
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function readTrackedTextFiles(paths) {
  const files = [];

  for (const filePath of paths) {
    try {
      const source = await readFile(filePath, "utf8");
      files.push({ path: filePath, source });
    } catch {
      // Binary or missing generated files are ignored by this text-oriented scan.
    }
  }

  return files;
}

export async function main() {
  const files = await readTrackedTextFiles(getTrackedFiles());
  const findings = findSecretFindings(files);

  if (findings.length > 0) {
    console.error("Secret scan failed:");
    for (const finding of findings) {
      console.error(`- ${finding.path}:${finding.line} ${finding.type}`);
    }
    process.exit(1);
  }

  logger.info("Secret scan passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
