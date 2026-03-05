-- Migration: Add Clerk ID to users table
-- This migration adds support for Clerk authentication

-- Add clerk_id column to sn_users
ALTER TABLE public.sn_users 
ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sn_users_clerk_id ON public.sn_users(clerk_id);

-- Update is_verified to true by default for new Clerk users
-- (Clerk handles email verification)
ALTER TABLE public.sn_users 
ALTER COLUMN is_verified SET DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.sn_users.clerk_id IS 'Clerk user ID for authentication';
