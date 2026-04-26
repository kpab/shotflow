#!/usr/bin/env node
import { cac } from "cac";
import { ZodError } from "zod";
import { VERSION, build } from "./index.js";

const cli = cac("shotflow");

cli
  .command("build <config>", "Build flow HTML from YAML config")
  .option("-o, --output <path>", "Output HTML path", { default: "./flow.html" })
  .option("--thumbnail-width <n>", "Thumbnail max width in px")
  .option("--original-width <n>", "Original image max width in px")
  .option("--quality <n>", "Image quality (1-100)")
  .option("--format <fmt>", "Image format: webp | jpeg | png")
  .option("--no-original", "Skip original image embedding (smaller output, no lightbox)")
  .action(async (configPath: string, options: Record<string, unknown>) => {
    try {
      const format = parseFormat(options.format);
      const outputPath = String(options.output ?? "./flow.html");
      const absOutputPath = await build({
        configPath,
        outputPath,
        options: {
          thumbnailWidth: parseNumber(options.thumbnailWidth, "--thumbnail-width"),
          originalWidth: parseNumber(options.originalWidth, "--original-width"),
          quality: parseNumber(options.quality, "--quality"),
          format,
          embedOriginal: options.original !== false,
        },
      });
      console.log(`Wrote ${absOutputPath}`);
    } catch (err) {
      reportError(err);
      process.exit(1);
    }
  });

cli.help();
cli.version(VERSION);
cli.parse();

function parseNumber(value: unknown, flag: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid ${flag}: must be a positive number`);
  }
  return n;
}

function parseFormat(value: unknown): "webp" | "jpeg" | "png" | undefined {
  if (value === undefined) return undefined;
  if (value !== "webp" && value !== "jpeg" && value !== "png") {
    throw new Error(`Invalid --format: must be webp, jpeg, or png`);
  }
  return value;
}

function reportError(err: unknown): void {
  if (err instanceof ZodError) {
    console.error("Validation errors:");
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "(root)";
      console.error(`  - ${path}: ${issue.message}`);
    }
  } else {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
}
