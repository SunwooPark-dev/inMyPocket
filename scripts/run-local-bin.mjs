#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function usage() {
  console.error("Usage: node scripts/run-local-bin.mjs <package> [binName] [args...]");
}

const [packageName, maybeBinName, ...restArgs] = process.argv.slice(2);

if (!packageName) {
  usage();
  process.exit(1);
}

const packageJsonPath = require.resolve(`${packageName}/package.json`, {
  paths: [process.cwd()]
});
const packageRoot = path.dirname(packageJsonPath);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const binField = packageJson.bin;

let binName = maybeBinName;
let forwardArgs = restArgs;

if (!binName) {
  if (typeof binField === "string") {
    binName = packageName;
  } else if (binField && typeof binField === "object") {
    const keys = Object.keys(binField);
    if (keys.length === 1) {
      [binName] = keys;
    }
  }
}

if (!binName) {
  console.error(`Could not infer bin name for package ${packageName}.`);
  usage();
  process.exit(1);
}

if (typeof binField === "object" && binField && !(binName in binField) && maybeBinName) {
  forwardArgs = [maybeBinName, ...restArgs];
  if (typeof binField === "string") {
    binName = packageName;
  } else {
    const keys = Object.keys(binField);
    if (keys.length === 1) {
      [binName] = keys;
    }
  }
}

let binRelativePath;
if (typeof binField === "string") {
  binRelativePath = binField;
} else if (binField && typeof binField === "object" && typeof binField[binName] === "string") {
  binRelativePath = binField[binName];
} else {
  console.error(`Package ${packageName} does not expose bin ${binName}.`);
  process.exit(1);
}

const binPath = path.resolve(packageRoot, binRelativePath);
const result = spawnSync(process.execPath, [binPath, ...forwardArgs], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
