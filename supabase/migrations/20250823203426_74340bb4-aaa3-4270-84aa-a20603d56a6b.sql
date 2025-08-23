-- Make the current user premium for testing
INSERT INTO public.subscribers (
  user_id,
  email,
  subscribed,
  subscription_tier,
  subscription_end,
  updated_at
) VALUES (
  '131cd0fb-6a25-4d19-bdab-b34bae9efd9d'::uuid,
  'omarmerheby7@gmail.com',
  true,
  'Premium',
  (now() + interval '1 year'),
  now()
) ON CONFLICT (user_id) 
DO UPDATE SET 
  subscribed = true,
  subscription_tier = 'Premium',
  subscription_end = (now() + interval '1 year'),
  updated_at = now();