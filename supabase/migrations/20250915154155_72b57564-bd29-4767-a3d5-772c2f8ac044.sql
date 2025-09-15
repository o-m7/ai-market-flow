-- Create 20 premium test accounts
INSERT INTO public.subscribers (
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  subscription_end,
  stripe_customer_id
) VALUES
  ('premium1@test.com', true, 'premium_monthly', now() - interval '30 days', now() - interval '23 days', now() + interval '6 months', 'cus_test_premium1'),
  ('premium2@test.com', true, 'premium_yearly', now() - interval '60 days', now() - interval '53 days', now() + interval '11 months', 'cus_test_premium2'),
  ('premium3@test.com', true, 'premium_monthly', now() - interval '15 days', now() - interval '8 days', now() + interval '6 months', 'cus_test_premium3'),
  ('premium4@test.com', true, 'premium_yearly', now() - interval '90 days', now() - interval '83 days', now() + interval '9 months', 'cus_test_premium4'),
  ('premium5@test.com', true, 'premium_monthly', now() - interval '45 days', now() - interval '38 days', now() + interval '6 months', 'cus_test_premium5'),
  ('premium6@test.com', true, 'premium_yearly', now() - interval '120 days', now() - interval '113 days', now() + interval '8 months', 'cus_test_premium6'),
  ('premium7@test.com', true, 'premium_monthly', now() - interval '10 days', now() - interval '3 days', now() + interval '6 months', 'cus_test_premium7'),
  ('premium8@test.com', true, 'premium_yearly', now() - interval '75 days', now() - interval '68 days', now() + interval '10 months', 'cus_test_premium8'),
  ('premium9@test.com', true, 'premium_monthly', now() - interval '25 days', now() - interval '18 days', now() + interval '6 months', 'cus_test_premium9'),
  ('premium10@test.com', true, 'premium_yearly', now() - interval '150 days', now() - interval '143 days', now() + interval '7 months', 'cus_test_premium10'),
  ('premium11@test.com', true, 'premium_monthly', now() - interval '5 days', now() + interval '2 days', now() + interval '6 months', 'cus_test_premium11'),
  ('premium12@test.com', true, 'premium_yearly', now() - interval '200 days', now() - interval '193 days', now() + interval '5 months', 'cus_test_premium12'),
  ('premium13@test.com', true, 'premium_monthly', now() - interval '35 days', now() - interval '28 days', now() + interval '6 months', 'cus_test_premium13'),
  ('premium14@test.com', true, 'premium_yearly', now() - interval '100 days', now() - interval '93 days', now() + interval '8 months', 'cus_test_premium14'),
  ('premium15@test.com', true, 'premium_monthly', now() - interval '20 days', now() - interval '13 days', now() + interval '6 months', 'cus_test_premium15'),
  ('premium16@test.com', true, 'premium_yearly', now() - interval '180 days', now() - interval '173 days', now() + interval '6 months', 'cus_test_premium16'),
  ('premium17@test.com', true, 'premium_monthly', now() - interval '8 days', now() - interval '1 day', now() + interval '6 months', 'cus_test_premium17'),
  ('premium18@test.com', true, 'premium_yearly', now() - interval '250 days', now() - interval '243 days', now() + interval '4 months', 'cus_test_premium18'),
  ('premium19@test.com', true, 'premium_monthly', now() - interval '50 days', now() - interval '43 days', now() + interval '6 months', 'cus_test_premium19'),
  ('premium20@test.com', true, 'premium_yearly', now() - interval '300 days', now() - interval '293 days', now() + interval '3 months', 'cus_test_premium20')
ON CONFLICT (email) DO NOTHING;