import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

export type ImageFormat = "webp" | "jpeg" | "png";

export interface ImageEmbedOptions {
  thumbnailWidth: number;
  quality: number;
  format: ImageFormat;
}

export async function embedImage(
  imagePath: string,
  baseDir: string,
  options: ImageEmbedOptions,
): Promise<string> {
  const absPath = resolve(baseDir, imagePath);
  let buffer: Buffer;
  try {
    buffer = await readFile(absPath);
  } catch (err) {
    throw new Error(
      `Failed to read image "${imagePath}" (resolved: ${absPath}): ${err instanceof Error ? err.message : String(err)}`,
    );
  }

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
