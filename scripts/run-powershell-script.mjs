#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const candidates = process.platform === "win32"
  ? ["powershell.exe", "powershell", "pwsh"]
  : ["powershell", "pwsh", "powershell.exe"];

function usage() {
  console.error("Usage: node scripts/run-powershell-script.mjs <script-path> [args...]");
}

function canRun(command) {
  const probeArgs = command === "pwsh" ? ["-NoLogo", "-NoProfile", "-Command", "exit 0"] : ["-NoLogo", "-NoProfile", "-Command", "exit 0"];
  const result = spawnSync(command, probeArgs, { stdio: "ignore" });
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

function toWindowsPath(inputPath) {
  const normalized = inputPath.replace(/\\/g, "/");
  const match = normalized.match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
  if (!match) {
    return inputPath;
  }
  const drive = match[1].toUpperCase();
  const rest = match[2].replace(/\//g, "\\");
  return `${drive}:\\${rest}`;
}

function normalizeArgForRunner(arg, runner) {
  if (runner !== "powershell.exe") {
    return arg;
  }

  if (arg.startsWith("/mnt/")) {
    return toWindowsPath(arg);
  }

  const equalsIndex = arg.indexOf("=");
  if (equalsIndex > 0) {
    const key = arg.slice(0, equalsIndex + 1);
    const value = arg.slice(equalsIndex + 1);
    if (value.startsWith("/mnt/")) {
      return `${key}${toWindowsPath(value)}`;
    }
  }

  return arg;
}

const [scriptArg, ...forwardArgs] = process.argv.slice(2);
if (!scriptArg) {
  usage();
  process.exit(1);
}

const resolvedScriptPath = path.resolve(process.cwd(), scriptArg);
if (!existsSync(resolvedScriptPath)) {
  console.error(`PowerShell script not found: ${resolvedScriptPath}`);
  process.exit(1);
}

const runner = selectRunner();
if (!runner) {
  console.error("No PowerShell runner found. Checked: powershell, pwsh, powershell.exe");
  process.exit(1);
}

const scriptPathForRunner = runner === "powershell.exe" ? toWindowsPath(resolvedScriptPath) : resolvedScriptPath;
const normalizedForwardArgs = forwardArgs.map((arg) => normalizeArgForRunner(arg, runner));
const runnerArgs = runner === "pwsh"
  ? ["-File", scriptPathForRunner, ...normalizedForwardArgs]
  : ["-ExecutionPolicy", "Bypass", "-File", scriptPathForRunner, ...normalizedForwardArgs];

const result = spawnSync(runner, runnerArgs, { stdio: "inherit" });
if (result.error) {
  console.error(`Failed to launch ${runner}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
