-- Mark all existing users as not having completed onboarding
-- This ensures they go through the onboarding flow

-- First, ensure the profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT DEFAULT 'starter',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);

-- Insert profiles for existing users who don't have profiles yet
INSERT INTO public.profiles (user_id, email, name, onboarding_completed)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  FALSE
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Update all existing profiles to mark onboarding as incomplete
UPDATE public.profiles 
SET 
  onboarding_completed = FALSE,
  updated_at = NOW()
WHERE onboarding_completed = TRUE OR onboarding_completed IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = TRUE THEN 1 END) as completed_onboarding,
  COUNT(CASE WHEN onboarding_completed = FALSE THEN 1 END) as incomplete_onboarding
FROM public.profiles;