import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SEED_PATH = resolve(process.cwd(), "supabase/seed.sql");
const DETERMINISTIC_SNAPSHOT_ID = "30328000-0000-0000-0000-000000000001";

function readSeedSql() {
  return readFileSync(SEED_PATH, "utf8");
}

function getInsertColumns(sql: string, tableName: string) {
  const escapedTableName = tableName.replace(".", "\\.");
  const match = sql.match(
    new RegExp(`INSERT INTO ${escapedTableName}\\s*\\(([\\s\\S]*?)\\)\\s*VALUES`, "i")
  );

  assert.ok(match, `Expected ${tableName} insert block in supabase/seed.sql`);

  return match[1]
    .split(",")
    .map((column) => column.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

test("supabase seed declares a deterministic governed 30328 snapshot contract", () => {
  const sql = readSeedSql();
  const snapshotColumns = getInsertColumns(sql, "public.price_publication_snapshots");

  assert.ok(snapshotColumns.includes("id"));
  assert.ok(snapshotColumns.includes("zip_code"));
  assert.ok(snapshotColumns.includes("label"));
  assert.ok(snapshotColumns.includes("review_status"));
  assert.ok(snapshotColumns.includes("coverage_rate"));
  assert.ok(snapshotColumns.includes("is_active"));

  assert.match(
    sql,
    new RegExp(
      `${DETERMINISTIC_SNAPSHOT_ID.replace(/-/g, "\\-")}[\\s\\S]*'30328'[\\s\\S]*'published'[\\s\\S]*(0\\.8|0\\.80|1(?:\\.0+)?)\\b[\\s\\S]*true`,
      "i"
    )
  );
});

test("supabase seed links at least one fresh public observation to the governed 30328 snapshot", () => {
  const sql = readSeedSql();
  const observationColumns = getInsertColumns(sql, "public.price_observations");

  for (const requiredColumn of [
    "zip_code",
    "channel",
    "review_status",
    "approved_at",
    "approved_by",
    "published_at",
    "published_snapshot_id"
  ]) {
    assert.ok(
      observationColumns.includes(requiredColumn),
      `Expected ${requiredColumn} column in public.price_observations seed insert`
    );
  }

  assert.match(sql, /'30328'/i);
  assert.match(sql, new RegExp(DETERMINISTIC_SNAPSHOT_ID.replace(/-/g, "\\-"), "i"));
  assert.match(sql, /'published'/i);
  assert.doesNotMatch(sql, /'30328'[\s\S]*'store_call'/i);
});
