import Anthropic from '@anthropic-ai/sdk';

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
      // HEIC, HEIF, BMP, TIFF etc. — treat as JPEG (most compatible)
      console.warn(`Unsupported image type "${mediaType}", treating as image/jpeg`);
      mediaType = 'image/jpeg';
    }

    imageBlocks.push({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: match[2],
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
