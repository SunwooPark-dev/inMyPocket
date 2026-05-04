#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const candidates = process.platform === "win32"
  ? ["python.exe", "python", "python3"]
  : ["python", "python3"];

function usage() {
  console.error("Usage: node scripts/run-python-script.mjs <script-path> [args...]");
}

function canRun(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error;
}

function selectRunner() {
  for (const candidate of candidates) {
    if (canRun(candidate)) {
      return candidate;
    }
  }
  return null;
}

const [scriptArg, ...forwardArgs] = process.argv.slice(2);
if (!scriptArg) {
  usage();
  process.exit(1);
}

const resolvedScriptPath = path.resolve(process.cwd(), scriptArg);
if (!existsSync(resolvedScriptPath)) {
  console.error(`Python script not found: ${resolvedScriptPath}`);
  process.exit(1);
}

const runner = selectRunner();
if (!runner) {
  console.error("No Python runner found. Checked: python, python3");
  process.exit(1);
}

const result = spawnSync(runner, [resolvedScriptPath, ...forwardArgs], { stdio: "inherit" });
if (result.error) {
  console.error(`Failed to launch ${runner}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
