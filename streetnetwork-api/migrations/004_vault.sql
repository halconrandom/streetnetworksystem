-- Migration 004: La Bóveda (The Vault)
-- Centralized Asset and Client Management for Corporate Operations

-- 1. Vault Assets (Vehicles, Properties, Equipment assigned to staff)
CREATE TABLE IF NOT EXISTS public.sn_vault_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- 'vehicle', 'property', 'equipment', 'other'
    identifier TEXT UNIQUE, -- Plate number, address, serial number
    owner_id UUID REFERENCES public.sn_users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- 'active', 'stored', 'damaged', 'lost'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Vault Clients (Professional interaction tracking)
CREATE TABLE IF NOT EXISTS public.sn_vault_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    tier TEXT DEFAULT 'standard', -- 'standard', 'premium', 'vip', 'blacklisted'
    loyalty_points INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    internal_notes TEXT,
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Audit trigger for update timestamps
CREATE OR REPLACE FUNCTION update_vault_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_vault_assets_timestamp
    BEFORE UPDATE ON public.sn_vault_assets
    FOR EACH ROW EXECUTE FUNCTION update_vault_timestamp();

CREATE TRIGGER trg_update_vault_clients_timestamp
    BEFORE UPDATE ON public.sn_vault_clients
    FOR EACH ROW EXECUTE FUNCTION update_vault_timestamp();
