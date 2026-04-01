/**
 * Extract dominant colors from an image using canvas pixel sampling
 * and simple color quantization via median-cut-inspired bucketing.
 */

export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  percentage: number;
}

/**
 * Extract dominant colors from an image data URL.
 * Returns up to `count` colors sorted by dominance.
 */
export async function extractColors(
  imageDataUrl: string,
  count: number = 5
): Promise<ExtractedColor[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Sample at small size for performance
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Collect all pixels, skip near-transparent
      const pixels: [number, number, number][] = [];
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue; // skip transparent
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      if (pixels.length === 0) {
        resolve([]);
        return;
      }

      // Quantize: bucket by reducing color space to ~32 levels per channel
      const bucketSize = 8;
      const buckets = new Map<string, { sum: [number, number, number]; count: number }>();

      for (const [r, g, b] of pixels) {
        const key = `${Math.floor(r / bucketSize)}-${Math.floor(g / bucketSize)}-${Math.floor(b / bucketSize)}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.sum[0] += r;
          existing.sum[1] += g;
          existing.sum[2] += b;
          existing.count++;
        } else {
          buckets.set(key, { sum: [r, g, b], count: 1 });
        }
      }

      // Sort by frequency, take top N
      const sorted = Array.from(buckets.values())
        .sort((a, b) => b.count - a.count);

      // Merge similar colors (within distance threshold)
      const merged: { rgb: [number, number, number]; count: number }[] = [];
      const threshold = 60;

      for (const bucket of sorted) {
        const avg: [number, number, number] = [
          Math.round(bucket.sum[0] / bucket.count),
          Math.round(bucket.sum[1] / bucket.count),
          Math.round(bucket.sum[2] / bucket.count),
        ];

        let wasMerged = false;
        for (const existing of merged) {
          const dist = Math.sqrt(
            (avg[0] - existing.rgb[0]) ** 2 +
            (avg[1] - existing.rgb[1]) ** 2 +
            (avg[2] - existing.rgb[2]) ** 2
          );
          if (dist < threshold) {
            // Weighted merge
            const total = existing.count + bucket.count;
            existing.rgb = [
              Math.round((existing.rgb[0] * existing.count + avg[0] * bucket.count) / total),
              Math.round((existing.rgb[1] * existing.count + avg[1] * bucket.count) / total),
              Math.round((existing.rgb[2] * existing.count + avg[2] * bucket.count) / total),
            ];
            existing.count = total;
            wasMerged = true;
            break;
          }
        }

        if (!wasMerged) {
          merged.push({ rgb: avg, count: bucket.count });
        }
      }

      // Sort merged by count, take top N
      merged.sort((a, b) => b.count - a.count);
      const totalPixels = pixels.length;
      const topColors = merged.slice(0, count);

      const result: ExtractedColor[] = topColors.map((c) => ({
        hex: rgbToHex(c.rgb),
        rgb: c.rgb,
        percentage: Math.round((c.count / totalPixels) * 100),
      }));

      resolve(result);
    };
    img.onerror = () => resolve([]);
    img.src = imageDataUrl;
  });
}

/**
 * Extract a combined palette from multiple images.
 * Merges individual palettes and re-ranks by overall frequency.
 */
export async function extractPaletteFromImages(
  imageDataUrls: string[],
  paletteSize: number = 7
): Promise<ExtractedColor[]> {
  if (imageDataUrls.length === 0) return [];

  // Extract from each image in parallel
  const allPalettes = await Promise.all(
    imageDataUrls.map((url) => extractColors(url, 8))
  );

  // Flatten and merge similar colors across all images
  const allColors: { rgb: [number, number, number]; weight: number }[] = [];
  const threshold = 50;

  for (const palette of allPalettes) {
    for (const color of palette) {
      let merged = false;
      for (const existing of allColors) {
        const dist = Math.sqrt(
          (color.rgb[0] - existing.rgb[0]) ** 2 +
          (color.rgb[1] - existing.rgb[1]) ** 2 +
          (color.rgb[2] - existing.rgb[2]) ** 2
        );
        if (dist < threshold) {
          const total = existing.weight + color.percentage;
          existing.rgb = [
            Math.round((existing.rgb[0] * existing.weight + color.rgb[0] * color.percentage) / total),
            Math.round((existing.rgb[1] * existing.weight + color.rgb[1] * color.percentage) / total),
            Math.round((existing.rgb[2] * existing.weight + color.rgb[2] * color.percentage) / total),
          ];
          existing.weight = total;
          merged = true;
          break;
        }
      }
      if (!merged) {
        allColors.push({ rgb: color.rgb, weight: color.percentage });
      }
    }
  }

  // Sort by weight, diversify (ensure colors are visually distinct)
  allColors.sort((a, b) => b.weight - a.weight);

  const finalPalette: ExtractedColor[] = [];
  const minDistance = 40;
  const totalWeight = allColors.reduce((sum, c) => sum + c.weight, 0);

  for (const color of allColors) {
    if (finalPalette.length >= paletteSize) break;

    const tooClose = finalPalette.some((existing) => {
      const dist = Math.sqrt(
        (color.rgb[0] - existing.rgb[0]) ** 2 +
        (color.rgb[1] - existing.rgb[1]) ** 2 +
        (color.rgb[2] - existing.rgb[2]) ** 2
      );
      return dist < minDistance;
    });

    if (!tooClose) {
      finalPalette.push({
        hex: rgbToHex(color.rgb),
        rgb: color.rgb,
        percentage: Math.round((color.weight / totalWeight) * 100),
      });
    }
  }

  return finalPalette;
}

function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Determine if a color is light (for text contrast)
 */
export function isLightColor(rgb: [number, number, number]): boolean {
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.55;
}
