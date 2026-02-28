-- 007_screenshot_review.sql
-- Stores the Discord review role per guild (set via /setscreenshotrank in Discord)
CREATE TABLE IF NOT EXISTS public.sn_screenshot_review_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id TEXT NOT NULL UNIQUE,
    review_role_id TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Each admin-panel user can configure their own Discord review channel
ALTER TABLE public.sn_users
    ADD COLUMN IF NOT EXISTS discord_review_channel_id TEXT;
