-- Consolidate duplicate categories, keeping the oldest row per (clerk_id, name, type).
-- References must be remapped first; otherwise deleting duplicate categories can
-- clear transaction categories or cascade-delete budgets.

-- If duplicate categories produced duplicate budgets for the same logical
-- category/month, keep the most recently edited budget row.
WITH ranked_budgets AS (
  SELECT
    b.id,
    ROW_NUMBER() OVER (
      PARTITION BY b.clerk_id, c.name, c.type, b.month, b.year
      ORDER BY b.updated_at DESC, b.created_at DESC, b.id DESC
    ) AS rn
  FROM public.fn_budgets b
  JOIN public.fn_transaction_categories c ON c.id = b.category_id
)
DELETE FROM public.fn_budgets b
USING ranked_budgets rb
WHERE b.id = rb.id
  AND rb.rn > 1;

-- Move transactions, recurring templates, and budgets to the canonical category.
WITH canonical_categories AS (
  SELECT DISTINCT ON (clerk_id, name, type)
    id AS canonical_id,
    clerk_id,
    name,
    type
  FROM public.fn_transaction_categories
  ORDER BY clerk_id, name, type, created_at ASC, id ASC
),
category_map AS (
  SELECT
    c.id AS duplicate_id,
    cc.canonical_id
  FROM public.fn_transaction_categories c
  JOIN canonical_categories cc
    ON cc.clerk_id = c.clerk_id
   AND cc.name = c.name
   AND cc.type = c.type
  WHERE c.id <> cc.canonical_id
)
UPDATE public.fn_transactions t
SET category_id = cm.canonical_id
FROM category_map cm
WHERE t.category_id = cm.duplicate_id;

WITH canonical_categories AS (
  SELECT DISTINCT ON (clerk_id, name, type)
    id AS canonical_id,
    clerk_id,
    name,
    type
  FROM public.fn_transaction_categories
  ORDER BY clerk_id, name, type, created_at ASC, id ASC
),
category_map AS (
  SELECT
    c.id AS duplicate_id,
    cc.canonical_id
  FROM public.fn_transaction_categories c
  JOIN canonical_categories cc
    ON cc.clerk_id = c.clerk_id
   AND cc.name = c.name
   AND cc.type = c.type
  WHERE c.id <> cc.canonical_id
)
UPDATE public.fn_recurring_templates r
SET category_id = cm.canonical_id
FROM category_map cm
WHERE r.category_id = cm.duplicate_id;

WITH canonical_categories AS (
  SELECT DISTINCT ON (clerk_id, name, type)
    id AS canonical_id,
    clerk_id,
    name,
    type
  FROM public.fn_transaction_categories
  ORDER BY clerk_id, name, type, created_at ASC, id ASC
),
category_map AS (
  SELECT
    c.id AS duplicate_id,
    cc.canonical_id
  FROM public.fn_transaction_categories c
  JOIN canonical_categories cc
    ON cc.clerk_id = c.clerk_id
   AND cc.name = c.name
   AND cc.type = c.type
  WHERE c.id <> cc.canonical_id
)
UPDATE public.fn_budgets b
SET category_id = cm.canonical_id
FROM category_map cm
WHERE b.category_id = cm.duplicate_id;

-- Remove duplicate category rows now that no finance rows reference them.
WITH canonical_categories AS (
  SELECT DISTINCT ON (clerk_id, name, type)
    id AS canonical_id,
    clerk_id,
    name,
    type
  FROM public.fn_transaction_categories
  ORDER BY clerk_id, name, type, created_at ASC, id ASC
)
DELETE FROM public.fn_transaction_categories c
USING canonical_categories cc
WHERE cc.clerk_id = c.clerk_id
  AND cc.name = c.name
  AND cc.type = c.type
  AND c.id <> cc.canonical_id;

-- Add unique constraint so future onboarding/category creation cannot duplicate rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_fn_categories_clerk_name_type'
      AND conrelid = 'public.fn_transaction_categories'::regclass
  ) THEN
    ALTER TABLE public.fn_transaction_categories
      ADD CONSTRAINT uq_fn_categories_clerk_name_type
      UNIQUE (clerk_id, name, type);
  END IF;
END;
$$;
