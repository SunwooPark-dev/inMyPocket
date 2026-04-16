-- Mock Data for InMyPocket Sprint 2 (Whale Defense)
-- Ensures initial data is available for analysis even without a real backend connection yet.

-- Dummy user profile (UUID: 00000000-0000-0000-0000-000000000000, assuming auth bypass for local dev or seed testing)
insert into public.profiles (id, display_name, currency, risk_tolerance)
values ('00000000-0000-0000-0000-000000000000', 'Whale User', 'USD', 'medium')
on conflict (id) do nothing;

-- Mock Accounts
insert into public.accounts (id, user_id, name, type, institution_name, balance)
values 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Main Checking', 'bank', 'Chase', 45000.00),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Crypto Vault', 'crypto', 'Coinbase', 85000.00),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Stock Portfolio', 'investment', 'Vanguard', 120500.00)
on conflict (id) do nothing;

-- Mock Assets
insert into public.assets (id, user_id, account_id, ticker, quantity, entry_price, current_price)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'AAPL', 150, 145.00, 175.50),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'TSLA', 50, 200.00, 180.20),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'BTC', 1.5, 45000.00, 62000.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'ETH', 10.0, 2000.00, 3100.00)
on conflict (id) do nothing;

-- Mock Transactions
insert into public.transactions (id, user_id, account_id, amount, type, category, description)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 5000.00, 'income', 'Salary', 'Monthly Salary'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 1200.00, 'expense', 'Housing', 'Rent Payment'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 3000.00, 'buy', 'Investment', 'Bought AAPL')
;
