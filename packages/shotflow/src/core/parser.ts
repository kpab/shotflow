import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { ConfigSchema, type Config } from "./schema.js";

export async function parseConfig(configPath: string): Promise<Config> {
  const absPath = resolve(configPath);
  const text = await readFile(absPath, "utf-8");
  const raw = parseYaml(text);
  const config = ConfigSchema.parse(raw);
  validateReferences(config);
  return config;
}

function validateReferences(config: Config): void {
  const screenIds = new Set<string>();
  for (const group of Object.values(config.groups)) {
    for (const screen of group.screens) {
      if (screenIds.has(screen.id)) {
        throw new Error(`Duplicate screen id: "${screen.id}"`);
      }
      screenIds.add(screen.id);
    }
  }
  for (const t of config.transitions) {
    if (!screenIds.has(t.from)) {
      throw new Error(
        `Transition references unknown screen id (from): "${t.from}"`,
      );
    }
    if (!screenIds.has(t.to)) {
      throw new Error(
        `Transition references unknown screen id (to): "${t.to}"`,
      );
    }
  }
  if (config.layout.groups) {
    const groupIds = new Set(Object.keys(config.groups));
    for (const id of config.layout.groups) {
      if (!groupIds.has(id)) {
        throw new Error(`layout.groups references unknown group: "${id}"`);
      }
    }
  }
}
