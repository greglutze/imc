/**
 * Storage interface for audio files and artwork.
 * Currently uses local/stub storage. Ready to swap for R2/S3.
 *
 * To enable R2/S3, set these env vars:
 *   STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
 *   STORAGE_ACCESS_KEY=...
 *   STORAGE_SECRET_KEY=...
 *   STORAGE_BUCKET=imc-share
 *   STORAGE_PUBLIC_URL=https://your-cdn-domain.com
 */

import crypto from 'crypto';
import path from 'path';

interface StorageResult {
  key: string;
  url: string;
  size: number;
}

function generateKey(prefix: string, filename: string): string {
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(filename).toLowerCase();
  return `${prefix}/${hash}${ext}`;
}

/**
 * Upload a file buffer to storage.
 * Returns a storage key and a URL for access.
 *
 * STUB: In V1 without R2/S3, stores as base64 data URL in the DB.
 * The "key" is a generated identifier, and "url" is a data URL.
 * When R2/S3 is configured, this will upload to object storage
 * and return a real URL.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  prefix: string = 'audio'
): Promise<StorageResult> {
  const key = generateKey(prefix, filename);

  // TODO: When R2/S3 is configured, replace with:
  // const client = new S3Client({ ... });
  // await client.send(new PutObjectCommand({ Bucket, Key: key, Body: buffer, ContentType }));
  // return { key, url: `${STORAGE_PUBLIC_URL}/${key}`, size: buffer.length };

  // Stub: encode as data URL
  const base64 = buffer.toString('base64');
  const url = `data:${contentType};base64,${base64}`;

  return { key, url, size: buffer.length };
}

/**
 * Upload artwork image.
 */
export async function uploadArtwork(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<StorageResult> {
  return uploadFile(buffer, filename, contentType, 'artwork');
}

/**
 * Get a URL for a stored file.
 * With R2/S3 this would generate a signed URL.
 * With stub storage, the URL is already embedded as a data URL.
 */
export function getFileUrl(storageKeyOrUrl: string): string {
  // If it's already a data URL or full URL, return as-is
  if (storageKeyOrUrl.startsWith('data:') || storageKeyOrUrl.startsWith('http')) {
    return storageKeyOrUrl;
  }

  // TODO: Generate signed URL from R2/S3
  // const command = new GetObjectCommand({ Bucket, Key: storageKeyOrUrl });
  // return getSignedUrl(client, command, { expiresIn: 14400 }); // 4 hours

  return storageKeyOrUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(_key: string): Promise<void> {
  // TODO: When R2/S3 is configured:
  // await client.send(new DeleteObjectCommand({ Bucket, Key: key }));

  // Stub: no-op (data is in DB)
}
