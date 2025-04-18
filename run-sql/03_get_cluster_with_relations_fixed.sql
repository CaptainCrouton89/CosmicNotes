-- Get cluster with related notes, tags and items in a single query
CREATE OR REPLACE FUNCTION public.get_cluster_with_relations(
  cluster_id bigint
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  cluster_data record;
  cluster_tag_id bigint;
  cluster_category varchar;
BEGIN
  -- Get the basic cluster data first
  SELECT c.*, t.* INTO cluster_data
  FROM cosmic_cluster c
  JOIN cosmic_tags t ON c.tag = t.id
  WHERE c.id = cluster_id;
  
  -- Get the tag id and category for filtering notes
  cluster_tag_id := cluster_data.tag;
  cluster_category := cluster_data.category;
  
  -- Build the complete result
  SELECT
    json_build_object(
      'id', c.id,
      'category', c.category,
      'summary', c.summary,
      'dirty', c.dirty,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'tag', json_build_object(
        'id', t.id,
        'name', t.name,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'dirty', t.dirty
      ),
      'cluster_items', COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', ci.id,
            'item', ci.item,
            'done', ci.done,
            'embedding', ci.embedding,
            'created_at', ci.created_at,
            'updated_at', ci.updated_at
          )
        )
        FROM cosmic_collection_item ci
        WHERE ci.cluster = c.id),
        '[]'::json
      ),
      'notes', COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', n.id,
            'title', n.title,
            'content', n.content,
            'zone', n.zone,
            'category', n.category,
            'created_at', n.created_at,
            'updated_at', n.updated_at,
            'metadata', n.metadata,
            'tags', COALESCE(
              (SELECT json_agg(
                json_build_object(
                  'id', tags.id,
                  'name', tags.name
                )
              )
              FROM cosmic_memory_tag_map tm
              JOIN cosmic_tags tags ON tm.tag = tags.id
              WHERE tm.note = n.id),
              '[]'::json
            ),
            'items', COALESCE(
              (SELECT json_agg(
                json_build_object(
                  'id', items.id,
                  'item', items.item,
                  'done', items.done,
                  'created_at', items.created_at,
                  'updated_at', items.updated_at
                )
              )
              FROM cosmic_collection_item items
              WHERE items.memory = n.id),
              '[]'::json
            )
          )
        )
        FROM cosmic_memory_tag_map tm
        JOIN cosmic_memory n ON tm.note = n.id
        WHERE tm.tag = cluster_tag_id
        AND n.category = cluster_category::note_category),
        '[]'::json
      ),
      'note_count', (
        SELECT COUNT(*)
        FROM cosmic_memory_tag_map tm
        JOIN cosmic_memory n ON tm.note = n.id
        WHERE tm.tag = cluster_tag_id
        AND n.category = cluster_category::note_category
      )
    ) INTO result
  FROM cosmic_cluster c
  JOIN cosmic_tags t ON c.tag = t.id
  WHERE c.id = cluster_id;

  RETURN result;
END;
$$; 