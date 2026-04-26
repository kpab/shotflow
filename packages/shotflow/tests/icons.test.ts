import { describe, it, expect } from "vitest";
import {
  hasIcon,
  listIconNames,
  renderIconSvg,
} from "../src/core/icons.js";

describe("icons", () => {
  it("includes the v0.2 baseline catalog", () => {
    const expected = [
      "mail",
      "bell",
      "link",
      "external-link",
      "lock",
      "user",
      "check",
      "x",
      "arrow-right",
      "database",
      "file",
      "send",
    ];
    for (const name of expected) {
      expect(hasIcon(name)).toBe(true);
    }
  });

  it("listIconNames returns all icon keys", () => {
    expect(listIconNames().length).toBeGreaterThanOrEqual(12);
  });

  it("renderIconSvg returns inline SVG with given coords and color", () => {
    const svg = renderIconSvg("mail", 10, 20, 16, "#0ea5e9");
    expect(svg).toContain('x="10"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('width="16"');
    expect(svg).toContain('stroke="#0ea5e9"');
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it("renderIconSvg returns empty string for unknown icon", () => {
    expect(renderIconSvg("nonexistent", 0, 0, 16, "#000")).toBe("");
  });
});
