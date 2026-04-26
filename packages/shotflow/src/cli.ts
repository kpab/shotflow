#!/usr/bin/env node
import { cac } from "cac";
import { ZodError } from "zod";
import { VERSION, parseConfig } from "./index.js";

const cli = cac("shotflow");

cli
  .command("build <config>", "Build flow HTML from YAML config")
  .action(async (configPath: string) => {
    try {
      const config = await parseConfig(configPath);
      const screenCount = Object.values(config.groups).reduce(
        (sum, g) => sum + g.screens.length,
        0,
      );
      console.log(
        `Parsed: ${screenCount} screens, ${config.transitions.length} transitions`,
      );
      console.log("(HTML rendering not yet implemented)");
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
