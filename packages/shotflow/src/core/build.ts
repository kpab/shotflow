import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseConfig } from "./parser.js";
import { render, type RenderOptions } from "./renderer.js";
import { ConfigSchema } from "./schema.js";

export type BuildRenderOptions = Omit<RenderOptions, "baseDir">;

export interface BuildOptions {
  configPath: string;
  outputPath: string;
  options?: BuildRenderOptions;
}

export async function build(opts: BuildOptions): Promise<string> {
  const config = await parseConfig(opts.configPath);
  const baseDir = dirname(resolve(opts.configPath));
  const html = await render(config, { baseDir, ...opts.options });
  const absOutputPath = resolve(opts.outputPath);
  await writeFile(absOutputPath, html, "utf-8");
  return absOutputPath;
}

export interface BuildFromObjectOptions {
  outputPath: string;
  baseDir?: string;
  options?: BuildRenderOptions;
}

export async function buildFromObject(
  configObj: unknown,
  opts: BuildFromObjectOptions,
): Promise<string> {
  const config = ConfigSchema.parse(configObj);
  const baseDir = opts.baseDir ?? process.cwd();
  const html = await render(config, { baseDir, ...opts.options });
  const absOutputPath = resolve(opts.outputPath);
  await writeFile(absOutputPath, html, "utf-8");
  return absOutputPath;
}
