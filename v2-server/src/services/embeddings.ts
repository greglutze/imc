/**
 * Embedding Service
 *
 * Generates vector embeddings for archive items using OpenAI's
 * text-embedding-3-large model (1536 dimensions).
 *
 * For text content: embeds the raw text directly.
 * For links: embeds the title + URL + any extracted text.
 * For images/audio/video: embeds the metadata + title (multimodal
 *   embedding via CLIP or similar comes later).
 *
 * The embedding is stored in the archive_items.embedding column
 * (pgvector vector(1536)) and powers all similarity search.
 */

import pool from '../config/database';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * Generate an embedding vector from text using OpenAI.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-key') {
    console.warn('[V2] No OpenAI API key configured — skipping embedding');
    return [];
  }

  // Truncate to ~8000 tokens (~32000 chars) to stay within model limits
  const truncated = text.slice(0, 32000);

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: truncated,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[V2] OpenAI embedding error:', err);
    throw new Error(`Embedding failed: ${response.status}`);
  }

  const result = (await response.json()) as EmbeddingResponse;
  return result.data[0].embedding;
}

/**
 * Build embeddable text from an archive item's content and metadata.
 * Combines all available text signals into a single string.
 */
export function buildEmbeddableText(item: {
  content_type: string;
  title?: string | null;
  raw_text?: string | null;
  file_url?: string | null;
  metadata?: Record<string, unknown>;
}): string {
  const parts: string[] = [];

  if (item.title) {
    parts.push(item.title);
  }

  if (item.raw_text) {
    parts.push(item.raw_text);
  }

  if (item.file_url) {
    parts.push(item.file_url);
  }

  // Include relevant metadata fields
  const meta = item.metadata || {};
  if (meta.emotional_register && Array.isArray(meta.emotional_register)) {
    parts.push(`emotional register: ${(meta.emotional_register as string[]).join(', ')}`);
  }
  if (meta.themes && Array.isArray(meta.themes)) {
    parts.push(`themes: ${(meta.themes as string[]).join(', ')}`);
  }
  if (meta.sonic_qualities && Array.isArray(meta.sonic_qualities)) {
    parts.push(`sonic qualities: ${(meta.sonic_qualities as string[]).join(', ')}`);
  }
  if (meta.visual_qualities && Array.isArray(meta.visual_qualities)) {
    parts.push(`visual qualities: ${(meta.visual_qualities as string[]).join(', ')}`);
  }
  if (meta.original_creator) {
    parts.push(`by ${meta.original_creator as string}`);
  }
  if (meta.era) {
    parts.push(`era: ${meta.era as string}`);
  }

  return parts.join('\n\n');
}

/**
 * Generate and store embedding for an archive item.
 * Called after item creation or when metadata is updated.
 */
export async function embedArchiveItem(itemId: string): Promise<void> {
  // Fetch the item
  const result = await pool.query(
    'SELECT content_type, title, raw_text, file_url, metadata FROM archive_items WHERE id = $1',
    [itemId]
  );

  if (result.rows.length === 0) {
    console.warn(`[V2] Item ${itemId} not found for embedding`);
    return;
  }

  const item = result.rows[0];
  const text = buildEmbeddableText(item);

  if (!text.trim()) {
    console.warn(`[V2] Item ${itemId} has no embeddable text — skipping`);
    return;
  }

  const embedding = await generateEmbedding(text);

  if (embedding.length === 0) {
    return; // No API key configured
  }

  // Store the embedding as a pgvector value
  const vectorStr = `[${embedding.join(',')}]`;
  await pool.query(
    'UPDATE archive_items SET embedding = $1::vector WHERE id = $2',
    [vectorStr, itemId]
  );

  console.log(`[V2] Embedded item ${itemId} (${embedding.length} dims, ${text.length} chars)`);
}

/**
 * Batch embed all items that don't have embeddings yet.
 * Useful for backfilling after the feature is first enabled.
 */
export async function backfillEmbeddings(artistId: string, batchSize = 10): Promise<number> {
  const result = await pool.query(
    `SELECT id FROM archive_items
     WHERE artist_id = $1 AND embedding IS NULL
     ORDER BY created_at ASC
     LIMIT $2`,
    [artistId, batchSize]
  );

  let count = 0;
  for (const row of result.rows) {
    try {
      await embedArchiveItem(row.id);
      count++;
    } catch (err) {
      console.error(`[V2] Failed to embed item ${row.id}:`, err);
    }
  }

  return count;
}
