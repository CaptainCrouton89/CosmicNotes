-- This is the SQL function you'll need to run in your Supabase SQL editor

-- Create the function to match cosmic_memory entries
CREATE OR REPLACE FUNCTION match_cosmic_memory(
  query_embedding vector,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.content,
    cm.metadata,
    cm.created_at,
    1 - (cm.embedding <=> query_embedding) as similarity
  FROM cosmic_memory cm
  WHERE 1 - (cm.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 