import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type from Claude API');
}

export async function analyze(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type from Claude API');
}

// Claude Vision API limit: 5MB per image (5,242,880 bytes)
const MAX_IMAGE_BYTES = 4_800_000; // leave a small buffer under 5MB

async function compressImageForApi(base64Data: string, mediaType: string): Promise<{ data: string; media_type: string }> {
  const inputBuffer = Buffer.from(base64Data, 'base64');

  // If already under limit, return as-is
  if (inputBuffer.length <= MAX_IMAGE_BYTES) {
    return { data: base64Data, media_type: mediaType };
  }

  console.log(`Compressing image: ${(inputBuffer.length / 1024 / 1024).toFixed(1)}MB → target <4.8MB`);

  // Resize and convert to JPEG for best compression
  let quality = 80;
  let width = 2048;
  let outputBuffer: Buffer;

  // Iteratively reduce quality/size until under limit
  do {
    outputBuffer = await sharp(inputBuffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    if (outputBuffer.length <= MAX_IMAGE_BYTES) break;

    // Reduce quality first, then size
    if (quality > 40) {
      quality -= 15;
    } else {
      width = Math.round(width * 0.7);
      quality = 70;
    }
  } while (width > 400);

  console.log(`Compressed to ${(outputBuffer.length / 1024 / 1024).toFixed(1)}MB (${width}px, q${quality})`);

  return {
    data: outputBuffer.toString('base64'),
    media_type: 'image/jpeg',
  };
}

export async function analyzeImages(
  systemPrompt: string,
  imageDataUrls: string[],
  textPrompt: string
): Promise<string> {
  // Supported media types for the Claude Vision API
  const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = [];
  for (const dataUrl of imageDataUrls) {
    // Extract media type and base64 data from data URL
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      console.warn('Skipping image with invalid data URL format');
      continue;
    }

    let mediaType = match[1];

    // Map unsupported types to closest supported type
    if (!SUPPORTED_TYPES.has(mediaType)) {
      console.warn(`Unsupported image type "${mediaType}", treating as image/jpeg`);
      mediaType = 'image/jpeg';
    }

    // Compress if over API size limit
    const compressed = await compressImageForApi(match[2], mediaType);

    imageBlocks.push({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: compressed.media_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: compressed.data,
      },
    });
  }

  if (imageBlocks.length === 0) {
    throw new Error('No valid images found for analysis');
  }

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text' as const, text: textPrompt },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type from Claude API');
}
