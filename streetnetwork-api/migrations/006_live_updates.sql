-- Create live updates table
CREATE TABLE IF NOT EXISTS public.sn_live_updates (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- e.g., 'feat', 'fix', 'refactor', 'security'
    message TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for active updates ordered by date
CREATE INDEX IF NOT EXISTS idx_sn_live_updates_active_date ON public.sn_live_updates (is_active, date DESC);

-- Add comments for documentation
COMMENT ON TABLE public.sn_live_updates IS 'Manually managed system updates and changelog entries.';
COMMENT ON COLUMN public.sn_live_updates.type IS 'Category of the update (feat, fix, etc.)';
COMMENT ON COLUMN public.sn_live_updates.message IS 'Short summary of the update.';
COMMENT ON COLUMN public.sn_live_updates.description IS 'Detailed explanation of the update.';
