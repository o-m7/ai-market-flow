-- Update user subscription to Premium for unlimited usage
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'Premium',
  subscription_end = (now() + interval '1 year'),
  updated_at = now()
WHERE email = 'omarmerheby7@gmail.com';

-- If no record exists, insert one
INSERT INTO public.subscribers (
  user_id,
  email,
  subscribed,
  subscription_tier,
  subscription_end,
  updated_at
) 
SELECT 
  '131cd0fb-6a25-4d19-bdab-b34bae9efd9d'::uuid,
  'omarmerheby7@gmail.com',
  true,
  'Premium',
  (now() + interval '1 year'),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscribers 
  WHERE email = 'omarmerheby7@gmail.com'
);