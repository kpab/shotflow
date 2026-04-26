#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cac } from "cac";
import { ZodError } from "zod";
import { VERSION, parseConfig, render } from "./index.js";

const cli = cac("shotflow");

cli
  .command("build <config>", "Build flow HTML from YAML config")
  .option("-o, --output <path>", "Output HTML path", { default: "./flow.html" })
  .action(async (configPath: string, options: { output: string }) => {
    try {
      const config = await parseConfig(configPath);
      const html = render(config);
      const outputPath = resolve(options.output);
      await writeFile(outputPath, html, "utf-8");
      console.log(`Wrote ${outputPath}`);
    } catch (err) {
      if (err instanceof ZodError) {
        console.error("Validation errors:");
        for (const issue of err.issues) {
          const path = issue.path.join(".") || "(root)";
          console.error(`  - ${path}: ${issue.message}`);
        }
      } else {
        console.error("Error:", err instanceof Error ? err.message : err);
      }
      process.exit(1);
    }
  });

cli.help();
cli.version(VERSION);
cli.parse();
