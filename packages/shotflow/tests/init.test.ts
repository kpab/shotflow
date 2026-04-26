import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "../src/commands/init.js";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "shotflow-init-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("init", () => {
  it("creates flow.yaml and images/ in the given dir", async () => {
    const result = await init({ dir: workDir });
    expect(result.yamlPath).toBe(join(workDir, "flow.yaml"));
    expect(result.imagesDir).toBe(join(workDir, "images"));
    expect(result.overwrote).toBe(false);

    const yaml = await readFile(result.yamlPath, "utf-8");
    expect(yaml).toContain("title: My App Flow");
    expect(yaml).toContain("groups:");

    const imagesStat = await stat(result.imagesDir);
    expect(imagesStat.isDirectory()).toBe(true);
  });

  it("creates the dir if it doesn't exist", async () => {
    const nested = join(workDir, "new", "project");
    const result = await init({ dir: nested });
    expect(result.yamlPath).toBe(join(nested, "flow.yaml"));
    const yaml = await readFile(result.yamlPath, "utf-8");
    expect(yaml.length).toBeGreaterThan(0);
  });

  it("refuses to overwrite an existing flow.yaml without --force", async () => {
    const existingYaml = "title: existing\ngroups:\n  a:\n    label: A\n    screens: []\n";
    await writeFile(join(workDir, "flow.yaml"), existingYaml, "utf-8");
    await expect(init({ dir: workDir })).rejects.toThrow(/already exists/);

    const yaml = await readFile(join(workDir, "flow.yaml"), "utf-8");
    expect(yaml).toBe(existingYaml);
  });

  it("overwrites with --force and reports overwrote=true", async () => {
    await writeFile(join(workDir, "flow.yaml"), "title: old\n", "utf-8");
    const result = await init({ dir: workDir, force: true });
    expect(result.overwrote).toBe(true);
    const yaml = await readFile(join(workDir, "flow.yaml"), "utf-8");
    expect(yaml).toContain("title: My App Flow");
  });

  it("generated yaml is parseable by parseConfig", async () => {
    const { parseConfig } = await import("../src/core/parser.js");
    const result = await init({ dir: workDir });
    const config = await parseConfig(result.yamlPath);
    expect(config.title).toBe("My App Flow");
    expect(Object.keys(config.groups)).toContain("main");
    expect(config.transitions.length).toBeGreaterThan(0);
  });
});
