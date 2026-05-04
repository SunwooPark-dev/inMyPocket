import test from "node:test";
import assert from "node:assert/strict";

import {
  SOURCE_QUALITY_GUIDE_ORDER,
  sourceLinkLabel,
  sourceQualityClassName,
  sourceQualityLabel,
  sourceQualityPrintLabel
} from "../src/lib/source-quality.ts";

test("source quality fallback stays conservative when page type is unknown", () => {
  assert.equal(sourceQualityLabel(undefined), "Source type not verified");
  assert.equal(sourceQualityPrintLabel(undefined), "Source type not verified");
  assert.match(sourceQualityClassName(undefined), /needs-review/);
  assert.equal(sourceLinkLabel(undefined), "Open official source");
});

test("source quality labels distinguish item, broader, and search-result sources", () => {
  assert.equal(sourceQualityPrintLabel("item_page"), "Exact item page");
  assert.equal(sourceQualityPrintLabel("category_page"), "Broader official page");
  assert.equal(sourceQualityPrintLabel("search_page"), "Search result - needs item-page check");
  assert.match(sourceQualityClassName("item_page"), /strong/);
  assert.match(sourceQualityClassName("category_page"), /broad/);
  assert.match(sourceQualityClassName("search_page"), /needs-review/);
});

test("source quality guide keeps the senior-facing explanation complete", () => {
  assert.deepEqual(SOURCE_QUALITY_GUIDE_ORDER, [
    "item_page",
    "category_page",
    "search_page",
    "operator_verified",
    "official_public_page"
  ]);
});
