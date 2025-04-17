-- Enhanced search_notes function that includes tags
CREATE OR REPLACE FUNCTION public.search_notes_with_tags(
  query_embedding vector(1536),
  match_threshold float8,
  match_count int,
  filter_category text DEFAULT NULL,
  filter_zone text DEFAULT NULL,
  filter_tag_ids bigint[] DEFAULT NULL
)
RETURNS SETOF json
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
DECLARE
  result json;
  note_record record;
  note_ids bigint[];
BEGIN
  -- Get matching notes
  SELECT array_agg(id) INTO note_ids
  FROM (
    SELECT id, 1 - (embedding <=> query_embedding) as score
    FROM cosmic_memory
    WHERE (1 - (embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR category = filter_category)
    AND (filter_zone IS NULL OR zone = filter_zone)
    ORDER BY score DESC
    LIMIT match_count
  ) AS matched_notes;

  -- Filter by tags if provided
  IF filter_tag_ids IS NOT NULL AND array_length(filter_tag_ids, 1) > 0 THEN
    SELECT array_agg(DISTINCT note) INTO note_ids
    FROM cosmic_memory_tag_map
    WHERE note = ANY(note_ids)
    AND tag = ANY(filter_tag_ids);
  END IF;

  -- Return notes with their tags in one query
  FOR note_record IN
    SELECT
      n.*,
      1 - (n.embedding <=> query_embedding) as score,
      COALESCE(
        (SELECT json_agg(t.*)
         FROM cosmic_memory_tag_map tm
         JOIN cosmic_tags t ON tm.tag = t.id
         WHERE tm.note = n.id),
        '[]'::json
      ) as tags
    FROM cosmic_memory n
    WHERE n.id = ANY(note_ids)
    ORDER BY 1 - (n.embedding <=> query_embedding) DESC
  LOOP
    result := row_to_json(note_record);
    RETURN NEXT result;
  END LOOP;

  RETURN;
END;
$$; 