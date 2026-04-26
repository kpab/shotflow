import { access, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface InitOptions {
  dir?: string;
  force?: boolean;
}

export interface InitResult {
  yamlPath: string;
  imagesDir: string;
  overwrote: boolean;
}

const TEMPLATE = `title: My App Flow
description: Screen transition diagram for my app

layout:
  direction: horizontal

groups:
  main:
    label: Main
    color: "#2563eb"
    screens:
      - id: home
        name: Home
        image: ./images/home.png
      - id: detail
        name: Detail
        image: ./images/detail.png

transitions:
  - from: home
    to: detail
    label: tap
`;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function init(options: InitOptions = {}): Promise<InitResult> {
  const dir = resolve(options.dir ?? ".");
  const yamlPath = join(dir, "flow.yaml");
  const imagesDir = join(dir, "images");

  await mkdir(dir, { recursive: true });

  const yamlExisted = await exists(yamlPath);
  if (yamlExisted && !options.force) {
    throw new Error(
      `flow.yaml already exists at ${yamlPath}. Use --force to overwrite.`,
    );
  }

  await mkdir(imagesDir, { recursive: true });
  await writeFile(yamlPath, TEMPLATE, "utf-8");

  return { yamlPath, imagesDir, overwrote: yamlExisted };
}
