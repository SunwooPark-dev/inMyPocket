import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const text = fs.readFileSync(path, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(new URL('../.env.local', import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Missing Supabase env');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const snapshotId = '30328000-0000-0000-0000-000000000001';
const now = new Date();
const approvedAt = new Date(now.getTime() - 90 * 60 * 1000).toISOString();
const publishedAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const collectedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

const seedRows = [
  ['bananas', 1.79, 1, 'lb', 'loose / 1 lb', 'exact'],
  ['apples', 4.99, 3, 'lb', '3 lb bag', 'exact'],
  ['strawberries', 2.99, 1, 'lb', '16 oz clamshell', 'exact'],
  ['oranges', 5.49, 3, 'lb', '3 lb bag', 'exact'],
  ['potatoes', 3.99, 5, 'lb', '5 lb bag', 'exact'],
  ['tomatoes', 1.69, 1, 'lb', 'roma / 1 lb', 'exact'],
  ['onions', 3.29, 3, 'lb', '3 lb bag', 'exact'],
  ['carrots', 1.99, 2, 'lb', '2 lb bag', 'exact'],
  ['chicken', 8.07, 2.7, 'lb', 'family pack / 2.7 lb', 'estimated-weight'],
  ['beef', 5.49, 1, 'lb', '1 lb pack', 'exact'],
  ['pork', 7.9, 2.4, 'lb', '2.4 lb tray', 'estimated-weight'],
  ['rice', 4.79, 5, 'lb', '5 lb bag', 'exact'],
  ['bread', 2.99, 22, 'oz', '22 oz loaf', 'exact'],
  ['milk', 3.79, 128, 'floz', '1 gallon', 'exact'],
  ['eggs', 2.99, 12, 'egg', '12 count', 'exact'],
  ['tuna', 4.99, 20, 'oz', '4 x 5 oz pack', 'exact'],
].map(([canonical_product_id, price_amount, measurement_value, measurement_unit, pack_label, comparability_grade]) => ({
  canonical_product_id,
  retailer_id: 'kroger',
  store_id: 'kroger-30328',
  zip_code: '30328',
  channel: 'product_page',
  price_type: 'regular',
  price_amount,
  measurement_value,
  measurement_unit,
  pack_label,
  comparability_grade,
  source_url: 'https://www.kroger.com',
  source_label: 'Official Kroger public web',
  collected_at: collectedAt,
  confidence: 'medium',
  notes: `Governed published seed row: ${canonical_product_id}`,
  evidence_id: null,
  review_status: 'published',
  approved_at: approvedAt,
  approved_by: 'seed:governance-30328',
  published_at: publishedAt,
  published_snapshot_id: snapshotId,
}));

const del = await supabase
  .from('price_observations')
  .delete({ count: 'exact' })
  .eq('zip_code', '30328')
  .eq('published_snapshot_id', snapshotId)
  .eq('review_status', 'published');
if (del.error) throw del.error;

const ins = await supabase.from('price_observations').insert(seedRows, { count: 'exact' });
if (ins.error) throw ins.error;

const verify = await supabase
  .from('published_price_observations')
  .select('zip_code,store_id,retailer_id,canonical_product_id,channel,price_type,review_status,published_snapshot_id')
  .eq('zip_code', '30328')
  .order('store_id')
  .order('canonical_product_id');
if (verify.error) throw verify.error;

console.log(JSON.stringify({ ok: true, deletedCount: del.count, insertedCount: ins.count, verifiedCount: verify.data.length, sample: verify.data.slice(0,5) }, null, 2));
