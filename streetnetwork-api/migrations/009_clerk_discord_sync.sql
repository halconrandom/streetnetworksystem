-- Migration: Add Discord columns and ensure Clerk sync columns exist
-- This migration ensures all columns needed for Clerk + Discord auth are present

-- 1. Ensure clerk_id column exists (should already exist from migration 003)
ALTER TABLE public.sn_users 
ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 2. Ensure discord columns exist
ALTER TABLE public.sn_users 
ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE;

ALTER TABLE public.sn_users 
ADD COLUMN IF NOT EXISTS discord_username TEXT;

ALTER TABLE public.sn_users 
ADD COLUMN IF NOT EXISTS discord_avatar TEXT;

-- 3. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sn_users_clerk_id ON public.sn_users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_sn_users_discord_id ON public.sn_users(discord_id);

-- 4. Ensure is_verified defaults to true for Clerk users (Clerk handles email verification)
ALTER TABLE public.sn_users 
ALTER COLUMN is_verified SET DEFAULT true;

-- 5. Add comments
COMMENT ON COLUMN public.sn_users.clerk_id IS 'Clerk user ID for authentication';
COMMENT ON COLUMN public.sn_users.discord_id IS 'Discord user ID from OAuth';
COMMENT ON COLUMN public.sn_users.discord_username IS 'Discord username';
COMMENT ON COLUMN public.sn_users.discord_avatar IS 'Discord avatar URL';