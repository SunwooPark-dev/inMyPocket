import { readFile } from "node:fs/promises";
import path from "node:path";

import { saveImportedObservation, saveImportedWaitlistEntry } from "../src/lib/server-storage.ts";

async function readJsonFile<T>(filepath: string) {
  try {
    const content = await readFile(filepath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return [] as T;
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const observationsPath = path.join(process.cwd(), "data", "observations.json");
  const waitlistPath = path.join(process.cwd(), "data", "waitlist.json");

  const observations = await readJsonFile<Array<Record<string, unknown>>>(observationsPath);
  const waitlistEntries = await readJsonFile<Array<Record<string, unknown>>>(waitlistPath);

  if (dryRun) {
    console.log(`dry-run observations=${observations.length} waitlist=${waitlistEntries.length}`);
    return;
  }

  let importedObservations = 0;
  let importedWaitlist = 0;

  for (const observation of observations) {
    await saveImportedObservation(observation);
    importedObservations += 1;
  }

  for (const entry of waitlistEntries) {
    await saveImportedWaitlistEntry(entry);
    importedWaitlist += 1;
  }

  console.log(`imported observations=${importedObservations} waitlist=${importedWaitlist}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
