-- Create premium account for omarmerheby195@gmail.com
INSERT INTO public.subscribers (
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  subscription_end,
  stripe_customer_id,
  user_id
) VALUES (
  'omarmerheby195@gmail.com', 
  true, 
  'premium_yearly', 
  now() - interval '30 days', 
  now() - interval '23 days', 
  now() + interval '2 years', 
  'cus_omar_premium',
  NULL
) ON CONFLICT (email) DO UPDATE SET
  subscribed = true,
  subscription_tier = 'premium_yearly',
  subscription_end = now() + interval '2 years';