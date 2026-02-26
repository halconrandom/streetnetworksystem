-- 005_screenshot_editor.sql

CREATE TABLE IF NOT EXISTS public.sn_seditorLoadPoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.sn_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_data_url TEXT NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sn_seditorLoadPoints_user_id ON public.sn_seditorLoadPoints(user_id);
