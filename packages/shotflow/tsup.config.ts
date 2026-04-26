import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  target: "node22",
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
});
