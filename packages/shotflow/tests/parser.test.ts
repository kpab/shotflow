import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseConfig } from "../src/core/parser.js";

let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "shotflow-test-"));
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function writeYaml(name: string, content: string): Promise<string> {
  const path = join(tempDir, name);
  await writeFile(path, content, "utf-8");
  return path;
}

describe("parseConfig", () => {
  it("loads a valid YAML config", async () => {
    const path = await writeYaml(
      "valid.yaml",
      `title: Test
groups:
  a:
    label: A
    screens:
      - id: s1
        name: Screen 1
        image: ./s1.png
transitions: []
`,
    );
    const config = await parseConfig(path);
    expect(config.title).toBe("Test");
    expect(config.groups.a?.screens).toHaveLength(1);
  });

  it("rejects duplicate screen ids across groups", async () => {
    const path = await writeYaml(
      "dup.yaml",
      `title: Test
groups:
  a:
    label: A
    screens:
      - { id: s1, name: A1, image: ./a.png }
  b:
    label: B
    screens:
      - { id: s1, name: B1, image: ./b.png }
`,
    );
    await expect(parseConfig(path)).rejects.toThrow(/Duplicate screen id/);
  });

  it("rejects unknown transition source", async () => {
    const path = await writeYaml(
      "bad-from.yaml",
      `title: Test
groups:
  a:
    label: A
    screens:
      - { id: s1, name: A, image: ./a.png }
transitions:
  - { from: nonexistent, to: s1 }
`,
    );
    await expect(parseConfig(path)).rejects.toThrow(/unknown screen id/);
  });

  it("rejects unknown transition target", async () => {
    const path = await writeYaml(
      "bad-to.yaml",
      `title: Test
groups:
  a:
    label: A
    screens:
      - { id: s1, name: A, image: ./a.png }
transitions:
  - { from: s1, to: nonexistent }
`,
    );
    await expect(parseConfig(path)).rejects.toThrow(/unknown screen id/);
  });

  it("rejects unknown layout.groups reference", async () => {
    const path = await writeYaml(
      "bad-layout.yaml",
      `title: Test
layout:
  groups: [a, missing]
groups:
  a:
    label: A
    screens:
      - { id: s1, name: A, image: ./a.png }
`,
    );
    await expect(parseConfig(path)).rejects.toThrow(/unknown group/);
  });

  it("rejects malformed YAML at the schema layer", async () => {
    const path = await writeYaml(
      "no-title.yaml",
      `groups:
  a:
    label: A
    screens:
      - { id: s1, name: A, image: ./a.png }
`,
    );
    await expect(parseConfig(path)).rejects.toThrow();
  });

  it("rejects when YAML file is missing", async () => {
    await expect(parseConfig(join(tempDir, "nonexistent.yaml"))).rejects.toThrow();
  });
});
