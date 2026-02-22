-- Create table for Nexus persistence
CREATE TABLE IF NOT EXISTS public.sn_nexus_states (
  user_id UUID PRIMARY KEY REFERENCES public.sn_users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance (though primary key is already indexed)
CREATE INDEX IF NOT EXISTS sn_nexus_states_user_id_idx ON public.sn_nexus_states(user_id);

-- Optional: Audit trigger if you want to track when users update their canvas
-- (Simplified version without full trigger for now since logic is in app)
