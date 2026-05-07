import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger.mjs";

function loadEnv(path) {
  const text = fs.readFileSync(path, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(new URL("../.env.local", import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing Supabase env");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const snapshotId = "97401000-0000-0000-0000-000000000001";
const now = new Date();
const approvedAt = new Date(now.getTime() - 90 * 60 * 1000).toISOString();
const publishedAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const collectedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

const rawSeedRows = [
  {
    canonical_product_id: "bananas",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 1.47,
    measurement_value: 3,
    measurement_unit: "lb",
    pack_label: "3 lb bunch",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/ip/188211987",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Bananas, 3 lb Bunch listed at $1.47 from official Walmart product page."
  },
  {
    canonical_product_id: "apples",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.97,
    measurement_value: 3,
    measurement_unit: "lb",
    pack_label: "3 lb bag",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/ip/44390991",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Granny Smith Apples, 3 lb Bag listed at $3.97 from official Walmart product page."
  },
  {
    canonical_product_id: "strawberries",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 2.96,
    measurement_value: 1,
    measurement_unit: "lb",
    pack_label: "1 lb container",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/c/kp/fresh-strawberries-1-lb",
    source_label: "Walmart official category page",
    source_quality: "category_page",
    notes: "Fresh Strawberries, 1 lb listed at $2.96 from official Walmart category page."
  },
  {
    canonical_product_id: "oranges",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.57,
    measurement_value: 3,
    measurement_unit: "lb",
    pack_label: "3 lb bag",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/ip/810976594",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Mandarin Oranges, 3 lb Bag listed at $3.57 from official Walmart product page."
  },
  {
    canonical_product_id: "potatoes",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 2.74,
    measurement_value: 5,
    measurement_unit: "lb",
    pack_label: "5 lb bag",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/10447837",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Whole Russet Potatoes 5 lb Bag listed at $2.74 from official Walmart product page."
  },
  {
    canonical_product_id: "tomatoes",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 0.97,
    measurement_value: 1,
    measurement_unit: "lb",
    pack_label: "sold by weight / 1 lb",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/44390944",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Roma Tomato, Each page lists 97.0 cents per lb on the official Walmart page."
  },
  {
    canonical_product_id: "onions",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 2.34,
    measurement_value: 3,
    measurement_unit: "lb",
    pack_label: "3 lb bag",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/10447842",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Yellow Onions 3 lb Bag listed at $2.34 from official Walmart product page."
  },
  {
    canonical_product_id: "carrots",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 1.97,
    measurement_value: 2,
    measurement_unit: "lb",
    pack_label: "2 lb bag",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/10535757",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Fresh Whole Carrots 2 lb Bag listed at $1.97 from official Walmart product page."
  },
  {
    canonical_product_id: "rice",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.37,
    measurement_value: 5.02,
    measurement_unit: "lb",
    pack_label: "5.02 lb bag",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/ip/10315395",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Great Value Long Grain Enriched Rice listed at $3.37 from official Walmart product page."
  },
  {
    canonical_product_id: "bread",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 1.27,
    measurement_value: 20,
    measurement_unit: "oz",
    pack_label: "20 oz loaf",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/10315752",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Great Value White Sandwich Bread, 20 oz listed at $1.27 from official Walmart product page."
  },
  {
    canonical_product_id: "milk",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.2,
    measurement_value: 128,
    measurement_unit: "floz",
    pack_label: "1 gallon",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/10450115",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Great Value 2% Reduced Fat Milk Gallon listed at $3.20 from official Walmart product page."
  },
  {
    canonical_product_id: "eggs",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 2.12,
    measurement_value: 12,
    measurement_unit: "egg",
    pack_label: "12 count",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/ip/133610861",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Great Value Jumbo White Eggs 12 Count listed at $2.12 from official Walmart product page."
  },
  {
    canonical_product_id: "tuna",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.84,
    measurement_value: 20,
    measurement_unit: "oz",
    pack_label: "4 x 5 oz pack",
    comparability_grade: "exact",
    source_url: "https://www.walmart.com/ip/33867594",
    source_label: "Walmart official product page",
    source_quality: "item_page",
    notes: "Great Value Chunk Light Tuna in Water, 5 oz, 4 Pack listed at $3.84 from official Walmart product page."
  },
  {
    canonical_product_id: "toilet-paper",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 11.62,
    measurement_value: 16000,
    measurement_unit: "sheet",
    pack_label: "16 rolls / 16,000 sheets",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/browse/household-essentials/great-value-toilet-paper/1115193_1073264_1149384_5796208",
    source_label: "Walmart official category page",
    source_quality: "category_page",
    notes: "Great Value 1000 Bath Tissue Rolls, 16 Rolls listed at $11.62 on the official Walmart category page."
  },
  {
    canonical_product_id: "detergent",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 7.67,
    measurement_value: 88,
    measurement_unit: "floz",
    pack_label: "88 fl oz bottle",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/browse/laundry-room/laundry-detergents/great-value/1115193_1071967_1149379/YnJhbmQ6R2Fpbnx8YnJhbmQ6R3JlYXQgVmFsdWUie",
    source_label: "Walmart official category page",
    source_quality: "category_page",
    notes: "Great Value Ultimate Fresh Laundry Detergent, 88 fl oz listed at $7.67 on the official Walmart category page."
  },
  {
    canonical_product_id: "toothpaste",
    retailer_id: "walmart",
    store_id: "walmart-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.96,
    measurement_value: 6,
    measurement_unit: "oz",
    pack_label: "6 oz tube",
    comparability_grade: "near-match",
    source_url: "https://www.walmart.com/search?q=toothpaste%206%20oz",
    source_label: "Walmart official search page",
    source_quality: "search_page",
    notes: "Walmart official search results show comparable 6 oz toothpaste options; operator should replace this with an item-detail URL when available."
  },
  {
    canonical_product_id: "milk",
    retailer_id: "fredmeyer",
    store_id: "fredmeyer-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 3.39,
    measurement_value: 128,
    measurement_unit: "floz",
    pack_label: "1 gallon",
    comparability_grade: "exact",
    source_url: "https://www.fredmeyer.com/p/fred-meyer-2-reduced-fat-milk/0001111041550",
    source_label: "Fred Meyer official product page",
    source_quality: "item_page",
    notes: "Fred Meyer 2% Reduced Fat Milk Gallon listed at $3.39 from official Fred Meyer product page."
  },
  {
    canonical_product_id: "rice",
    retailer_id: "fredmeyer",
    store_id: "fredmeyer-97401",
    zip_code: "97401",
    channel: "product_page",
    price_type: "regular",
    price_amount: 5.99,
    measurement_value: 5,
    measurement_unit: "lb",
    pack_label: "5 lb bag",
    comparability_grade: "exact",
    source_url: "https://www.fredmeyer.com/p/title/0001111062691",
    source_label: "Fred Meyer official product page",
    source_quality: "item_page",
    notes: "Kroger Mercado Long Grain Rice 5 lb listed at $5.99 from official Fred Meyer product page."
  }
].map((row) => ({
  id: crypto.randomUUID(),
  confidence: "medium",
  is_estimated_weight: false,
  is_membership_required: false,
  is_coupon_required: false,
  is_club_only: false,
  evidence_id: null,
  review_status: "published",
  approved_at: approvedAt,
  approved_by: "seed:eugene-97401",
  published_at: publishedAt,
  published_snapshot_id: snapshotId,
  collected_at: collectedAt,
  ...row
}));

const seedRows = rawSeedRows.map((row) => {
  const sanitizedRow = { ...row };
  delete sanitizedRow.source_quality;
  return sanitizedRow;
});

const snapshotRow = {
  id: snapshotId,
  zip_code: "97401",
  label: "ZIP 97401 verified local prices seed",
  review_status: "published",
  coverage_rate: 0.8,
  approved_at: approvedAt,
  approved_by: "seed:eugene-97401",
  published_at: publishedAt,
  is_active: true
};

const snapshotDelete = await supabase
  .from("price_publication_snapshots")
  .delete()
  .eq("id", snapshotId);

if (snapshotDelete.error) throw snapshotDelete.error;

const snapshotInsert = await supabase
  .from("price_publication_snapshots")
  .insert(snapshotRow);

if (snapshotInsert.error) throw snapshotInsert.error;

const del = await supabase
  .from("price_observations")
  .delete({ count: "exact" })
  .eq("zip_code", "97401")
  .eq("published_snapshot_id", snapshotId);
if (del.error) throw del.error;

const ins = await supabase.from("price_observations").insert(seedRows, { count: "exact" });
if (ins.error) throw ins.error;

const verify = await supabase
  .from("published_price_observations")
  .select("zip_code,store_id,retailer_id,canonical_product_id,price_amount,measurement_value,measurement_unit,comparability_grade,source_url")
  .eq("zip_code", "97401")
  .order("store_id")
  .order("canonical_product_id");
if (verify.error) throw verify.error;

logger.info(
  JSON.stringify(
    {
      ok: true,
      deletedCount: del.count,
      insertedCount: ins.count,
      verifiedCount: verify.data.length,
      sample: verify.data.slice(0, 5)
    },
    null,
    2
  )
);
