-- Create indices to improve performance of our optimized queries

-- Index for tag lookups
CREATE INDEX IF NOT EXISTS idx_cosmic_memory_tag_map_tag 
ON cosmic_memory_tag_map (tag);

-- Index for note lookups
CREATE INDEX IF NOT EXISTS idx_cosmic_memory_tag_map_note 
ON cosmic_memory_tag_map (note);

-- Index for memory lookups in collection items
CREATE INDEX IF NOT EXISTS idx_cosmic_collection_item_memory 
ON cosmic_collection_item (memory);

-- Index for cluster lookups in collection items
CREATE INDEX IF NOT EXISTS idx_cosmic_collection_item_cluster 
ON cosmic_collection_item (cluster);

-- Index for category filtered queries in cosmic_memory
CREATE INDEX IF NOT EXISTS idx_cosmic_memory_category 
ON cosmic_memory (category);

-- Index for zone filtered queries in cosmic_memory
CREATE INDEX IF NOT EXISTS idx_cosmic_memory_zone 
ON cosmic_memory (zone);

-- Index for tag lookups with category
CREATE INDEX IF NOT EXISTS idx_cosmic_cluster_tag_category 
ON cosmic_cluster (tag, category);

-- Test query performance
EXPLAIN ANALYZE
SELECT *
FROM get_tag_with_relations(1);

EXPLAIN ANALYZE
SELECT *
FROM get_cluster_with_relations(1);

-- Test query for search_notes_with_tags
EXPLAIN ANALYZE
SELECT *
FROM search_notes_with_tags(
  ARRAY[0, 0, 0, 0, 0]::vector(5), -- Just a dummy vector for testing
  0.5,
  10,
  'journal',
  'personal',
  ARRAY[1, 2]::bigint[]
);

-- Test the nested query approach directly
EXPLAIN ANALYZE
SELECT *
FROM cosmic_tags t
LEFT JOIN LATERAL (
  SELECT json_agg(n.*) as notes
  FROM cosmic_memory_tag_map tm
  JOIN cosmic_memory n ON tm.note = n.id
  WHERE tm.tag = t.id
) notes ON true
LEFT JOIN LATERAL (
  SELECT json_agg(c.*) as clusters
  FROM cosmic_cluster c
  WHERE c.tag = t.id
) clusters ON true
WHERE t.id = 1; 