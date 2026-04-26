import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

export type ImageFormat = "webp" | "jpeg" | "png";

export interface ImageEmbedOptions {
  thumbnailWidth: number;
  quality: number;
  format: ImageFormat;
}

async function readImage(imagePath: string, baseDir: string): Promise<Buffer> {
  const absPath = resolve(baseDir, imagePath);
  try {
    return await readFile(absPath);
  } catch (err) {
    throw new Error(
      `Failed to read image "${imagePath}" (resolved: ${absPath}): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function processBuffer(
  buffer: Buffer,
  options: ImageEmbedOptions,
): Promise<string> {
  const pipeline = sharp(buffer).resize({
    width: options.thumbnailWidth,
    withoutEnlargement: true,
    fit: "inside",
  });

  let outBuffer: Buffer;
  let mime: string;
  switch (options.format) {
    case "webp":
      outBuffer = await pipeline.webp({ quality: options.quality }).toBuffer();
      mime = "image/webp";
      break;
    case "jpeg":
      outBuffer = await pipeline.jpeg({ quality: options.quality }).toBuffer();
      mime = "image/jpeg";
      break;
    case "png":
      outBuffer = await pipeline.png({ quality: options.quality }).toBuffer();
      mime = "image/png";
      break;
  }

  return `data:${mime};base64,${outBuffer.toString("base64")}`;
}

export async function embedImage(
  imagePath: string,
  baseDir: string,
  options: ImageEmbedOptions,
): Promise<string> {
  const buffer = await readImage(imagePath, baseDir);
  return processBuffer(buffer, options);
}

export async function embedImagePair(
  imagePath: string,
  baseDir: string,
  thumbOpts: ImageEmbedOptions,
  originalOpts: ImageEmbedOptions | null,
): Promise<{ thumb: string; original?: string }> {
  const buffer = await readImage(imagePath, baseDir);
  const thumb = await processBuffer(buffer, thumbOpts);
  if (!originalOpts) return { thumb };
  const original = await processBuffer(buffer, originalOpts);
  return { thumb, original };
}
