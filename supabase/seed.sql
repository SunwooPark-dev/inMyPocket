-- ==============================================================================
-- 🚀 [Dummy Dataset] InMyPoket Seed Data
-- ==============================================================================
-- 이 파일은 로컬 Smoke Test 및 UI 개발을 위한 대규모 더미 데이터를 포함합니다.

-- 1. Dummy Evidence Data
INSERT INTO public.observation_evidence (id, storage_path, original_name, content_type, byte_size)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'receipts/mock_01.jpg', 'receipt_trader_joes.jpg', 'image/jpeg', 245000),
  ('22222222-2222-2222-2222-222222222222', 'receipts/mock_02.jpg', 'receipt_wholefoods.jpg', 'image/jpeg', 320000)
ON CONFLICT (id) DO NOTHING;

-- 2. Minimal governed 30328 publication snapshot for Governance Kernel 1
INSERT INTO public.price_publication_snapshots (
  id,
  zip_code,
  label,
  review_status,
  coverage_rate,
  approved_at,
  approved_by,
  published_at,
  is_active
)
VALUES (
  '30328000-0000-0000-0000-000000000001',
  '30328',
  'ZIP 30328 governance seed',
  'published',
  0.80,
  now() - interval '90 minutes',
  'seed:governance-30328',
  now() - interval '60 minutes',
  true
)
ON CONFLICT DO NOTHING;

-- 3. Dummy Price Observations (Realistic Grocery Data + governed published 30328 basket rows)
INSERT INTO public.price_observations (
  id, canonical_product_id, retailer_id, store_id, zip_code, channel, price_type, price_amount,
  measurement_value, measurement_unit, pack_label, comparability_grade, source_url, source_label,
  collected_at, confidence, notes, evidence_id, review_status, approved_at, approved_by,
  published_at, published_snapshot_id
)
VALUES
  (gen_random_uuid(), 'org-milk-1gal', 'TRADER_JOES', 'TJ-012', '90210', 'in_store', 'regular', 5.99, 1.0, 'gallon', '1 Gallon', 'A', 'offline', 'Store Visit', now() - interval '2 hours', 'high', 'Organic Whole Milk', '11111111-1111-1111-1111-111111111111', 'draft', null, null, null, null),
  (gen_random_uuid(), 'org-milk-1gal', 'WHOLE_FOODS', 'WF-452', '90210', 'in_store', 'regular', 6.49, 1.0, 'gallon', '1 Gallon', 'A', 'offline', 'Store Visit', now() - interval '5 hours', 'high', '365 Brand Whole Milk', '22222222-2222-2222-2222-222222222222', 'draft', null, null, null, null),
  (gen_random_uuid(), 'eggs-large-12', 'RALPHS', 'RAL-991', '90210', 'online', 'sale', 3.99, 12, 'count', '1 Dozen', 'B', 'https://ralphs.com/eggs', 'Web Scrape', now() - interval '1 day', 'medium', 'On sale from 4.99', null, 'draft', null, null, null, null),
  (gen_random_uuid(), 'chicken-breast-boneless', 'COSTCO', 'COST-001', '90211', 'in_store', 'regular', 2.99, 1.0, 'lb', 'Bulk Family Pack', 'B', 'offline', 'User Submission', now() - interval '2 days', 'high', 'Requires membership', null, 'draft', null, null, null, null),
(gen_random_uuid(), 'bananas', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 1.79, 1.0, 'lb', '1 lb', 'exact', 'https://www.kroger.com/search?query=bananas', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'apples', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.49, 3.0, 'lb', '3 lb bag', 'exact', 'https://www.kroger.com/search?query=apples', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'strawberries', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.99, 1.0, 'lb', '1 lb clamshell', 'exact', 'https://www.kroger.com/search?query=strawberries', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'oranges', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 4.99, 3.0, 'lb', '3 lb bag', 'exact', 'https://www.kroger.com/search?query=oranges', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'potatoes', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 4.49, 5.0, 'lb', '5 lb bag', 'exact', 'https://www.kroger.com/search?query=potatoes', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'tomatoes', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 2.49, 1.0, 'lb', '1 lb', 'exact', 'https://www.kroger.com/search?query=tomatoes', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'onions', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.29, 3.0, 'lb', '3 lb bag', 'exact', 'https://www.kroger.com/search?query=onions', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'carrots', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 2.29, 2.0, 'lb', '2 lb bag', 'exact', 'https://www.kroger.com/search?query=carrots', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'chicken', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.49, 1.0, 'lb', 'Boneless breast, per lb', 'exact', 'https://www.kroger.com/search?query=chicken', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'beef', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 5.99, 1.0, 'lb', 'Ground beef, per lb', 'exact', 'https://www.kroger.com/search?query=beef', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'pork', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.99, 1.0, 'lb', 'Pork chops, per lb', 'exact', 'https://www.kroger.com/search?query=pork', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'rice', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 2.99, 2.0, 'lb', '2 lb bag', 'exact', 'https://www.kroger.com/search?query=rice', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'bread', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 2.49, 20.0, 'oz', '20 oz loaf', 'exact', 'https://www.kroger.com/search?query=bread', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'milk', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.79, 1.0, 'gallon', '1 gallon', 'exact', 'https://www.kroger.com/search?query=milk', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'eggs', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 3.29, 12.0, 'count', '1 dozen', 'exact', 'https://www.kroger.com/search?query=eggs', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'tuna', 'kroger', 'kroger-30328', '30328', 'product_page', 'regular', 1.29, 5.0, 'oz', '5 oz can', 'exact', 'https://www.kroger.com/search?query=tuna', 'Kroger product page', now() - interval '2 hours', 'high', 'Governed 30328 runtime seed row', null, 'published', now() - interval '90 minutes', 'seed:governance-30328', now() - interval '60 minutes', '30328000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 3. Dummy Founding Members (Stripe Waitlist Test)
INSERT INTO public.founding_member_signups (email, zip_code, plan_code, status)
VALUES 
  ('early.adopter@test.com', '10001', 'FOUNDING_TIER_1', 'active'),
  ('pending.user@test.com', '90210', 'FOUNDING_TIER_1', 'pending_checkout'),
  ('lost.lead@test.com', '94105', 'FOUNDING_TIER_2', 'abandoned')
ON CONFLICT DO NOTHING;
