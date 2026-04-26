-- Remove duplicate categories, keeping the oldest row per (clerk_id, name, type)
DELETE FROM public.fn_transaction_categories
WHERE id NOT IN (
  SELECT DISTINCT ON (clerk_id, name, type) id
  FROM public.fn_transaction_categories
  ORDER BY clerk_id, name, type, created_at ASC
);

-- Add unique constraint so ON CONFLICT DO NOTHING works in seeding
ALTER TABLE public.fn_transaction_categories
  ADD CONSTRAINT uq_fn_categories_clerk_name_type
  UNIQUE (clerk_id, name, type);
