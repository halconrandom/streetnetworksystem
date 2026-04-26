-- Re-run this in Supabase SQL Editor to replace the previous version

CREATE OR REPLACE FUNCTION public.run_query(
  query_text text,
  query_params text[] DEFAULT '{}'::text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  i int;
  n int;
  upper_q text;
BEGIN
  -- Substitute $1, $2, ... with quoted values.
  -- COALESCE handles NULL params: quote_literal(NULL) = NULL which would
  -- propagate through replace() and wipe query_text entirely.
  n := coalesce(array_length(query_params, 1), 0);
  FOR i IN 1..n LOOP
    query_text := replace(query_text, '$' || i, COALESCE(quote_literal(query_params[i]), 'NULL'));
  END LOOP;

  upper_q := upper(trim(regexp_replace(query_text, '\s+', ' ', 'g')));

  IF upper_q LIKE 'SELECT%' THEN
    -- Plain SELECT: wrap in subquery to aggregate as JSON
    EXECUTE format(
      'SELECT array_to_json(array_agg(row_to_json(_t))) FROM (%s) _t',
      query_text
    ) INTO result;
    RETURN coalesce(result, '[]'::json);

  ELSIF position(' RETURNING ' IN upper_q) > 0 OR upper_q LIKE '%RETURNING%' THEN
    -- INSERT / UPDATE / DELETE with RETURNING: PostgreSQL does not allow DML
    -- directly in a FROM subquery, so use a data-modifying CTE instead.
    EXECUTE format(
      'WITH _cte AS (%s) SELECT array_to_json(array_agg(row_to_json(_t))) FROM _cte _t',
      query_text
    ) INTO result;
    RETURN coalesce(result, '[]'::json);

  ELSE
    -- Plain DML without RETURNING
    EXECUTE query_text;
    RETURN '[]'::json;
  END IF;
END;
$$;

-- Only service_role can call this
REVOKE ALL ON FUNCTION public.run_query FROM PUBLIC, anon, authenticated;
