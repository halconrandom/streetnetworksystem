-- Migration: Clean user tables and add Clerk ID
-- Removes all legacy users/flags and sets up proper Clerk integration

-- 1. Limpiar flags primero (FK dependency)
TRUNCATE TABLE public.sn_user_flags CASCADE;

-- 2. Limpiar usuarios legacy
TRUNCATE TABLE public.sn_users CASCADE;

-- 3. Agregar columna clerk_id si no existe
ALTER TABLE public.sn_users 
ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 4. Índice para lookups rápidos por clerk_id
CREATE INDEX IF NOT EXISTS idx_sn_users_clerk_id ON public.sn_users(clerk_id);

-- 5. is_verified = true por defecto (Clerk maneja verificación de email)
ALTER TABLE public.sn_users 
ALTER COLUMN is_verified SET DEFAULT true;

-- 6. Comentario
COMMENT ON COLUMN public.sn_users.clerk_id IS 'Clerk user ID (primary auth identifier)';
