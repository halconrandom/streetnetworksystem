-- Migration: Add user_id to message builder tables
-- This ensures each user only sees their own data

-- Add user_id column to sn_messagebuilder_webhook_targets
ALTER TABLE public.sn_messagebuilder_webhook_targets
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.sn_users(id) ON DELETE CASCADE;

-- Add user_id column to sn_messagebuilder_templates
ALTER TABLE public.sn_messagebuilder_templates
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.sn_users(id) ON DELETE CASCADE;

-- Add user_id column to sn_messagebuilder_mentions
ALTER TABLE public.sn_messagebuilder_mentions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.sn_users(id) ON DELETE CASCADE;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messagebuilder_webhooks_user_id
ON public.sn_messagebuilder_webhook_targets(user_id);

CREATE INDEX IF NOT EXISTS idx_messagebuilder_templates_user_id
ON public.sn_messagebuilder_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_messagebuilder_mentions_user_id
ON public.sn_messagebuilder_mentions(user_id);

-- Update existing rows to set user_id to NULL (global data)
-- These will be accessible by all users until they create their own
-- Alternatively, you can delete them or assign to a specific admin user
-- UPDATE public.sn_messagebuilder_webhook_targets SET user_id = 'admin-user-uuid' WHERE user_id IS NULL;