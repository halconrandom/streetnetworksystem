-- Migration: Add clerk_id to message builder tables
-- This ensures each user only sees their own data

-- Add clerk_id column to sn_messagebuilder_webhook_targets
ALTER TABLE public.sn_messagebuilder_webhook_targets
ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Add clerk_id column to sn_messagebuilder_templates
ALTER TABLE public.sn_messagebuilder_templates
ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Add clerk_id column to sn_messagebuilder_mentions
ALTER TABLE public.sn_messagebuilder_mentions
ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messagebuilder_webhooks_clerk_id
ON public.sn_messagebuilder_webhook_targets(clerk_id);

CREATE INDEX IF NOT EXISTS idx_messagebuilder_templates_clerk_id
ON public.sn_messagebuilder_templates(clerk_id);

CREATE INDEX IF NOT EXISTS idx_messagebuilder_mentions_clerk_id
ON public.sn_messagebuilder_mentions(clerk_id);