import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicSmokeSource = readFileSync(new URL("../scripts/public-smoke.ps1", import.meta.url), "utf8");

test("public smoke treats printable governed data as basket-or-honest-unavailable", () => {
  assert.match(publicSmokeSource, /function Assert-PrintableBasketOrHonestUnavailable/);
  assert.match(publicSmokeSource, /Shop here today:/);
  assert.match(publicSmokeSource, /Printable basket unavailable for now\\\./);
  assert.match(
    publicSmokeSource,
    /could not load the current published comparison\|not enough governed published prices/
  );
});

test("public smoke keeps source-quality assertions gated behind a rendered printable basket", () => {
  const printable30022Index = publicSmokeSource.indexOf('Assert-PrintableBasketOrHonestUnavailable $alpharettaPrintable.Content "printable 30022"');
  const sourceQualityIndex = publicSmokeSource.indexOf('Assert-Contains $alpharettaPrintable.Content "Source check:"');
  const basketGuardIndex = publicSmokeSource.indexOf('if ($alpharettaPrintable.Content -match "Shop here today:")');

  assert.ok(printable30022Index > -1, "30022 printable must use basket-or-unavailable assertion");
  assert.ok(basketGuardIndex > printable30022Index, "source quality checks must be guarded after printable classification");
  assert.ok(sourceQualityIndex > basketGuardIndex, "source quality checks should run only when a basket renders");
});

test("public smoke uses current North Atlanta pilot ZIPs instead of stale Eugene fixture", () => {
  assert.match(publicSmokeSource, /zip=30022/);
  assert.match(publicSmokeSource, /Alpharetta East/);
  assert.doesNotMatch(publicSmokeSource, /zip=97401|Eugene Core/);
});
