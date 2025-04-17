-- Get tag with related notes and clusters in a single query
CREATE OR REPLACE FUNCTION public.get_tag_with_relations(
  tag_id bigint
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT
    json_build_object(
      'id', t.id,
      'name', t.name,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'dirty', t.dirty,
      'notes', COALESCE(
        (SELECT json_agg(n.*)
         FROM cosmic_memory_tag_map tm
         JOIN cosmic_memory n ON tm.note = n.id
         WHERE tm.tag = t.id),
        '[]'::json
      ),
      'clusters', COALESCE(
        (SELECT json_agg(c.*)
         FROM cosmic_cluster c
         WHERE c.tag = t.id),
        '[]'::json
      ),
      'note_count', (
        SELECT COUNT(*)
        FROM cosmic_memory_tag_map tm
        WHERE tm.tag = t.id
      )
    ) INTO result
  FROM cosmic_tags t
  WHERE t.id = tag_id;

  RETURN result;
END;
$$; 