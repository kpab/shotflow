import { describe, it, expect } from "vitest";
import { ConfigSchema } from "../src/core/schema.js";
import { computeLayout } from "../src/core/layout.js";

function makeConfig(overrides: Record<string, unknown> = {}) {
  return ConfigSchema.parse({
    title: "T",
    groups: {
      admin: {
        label: "Admin",
        color: "#2563eb",
        screens: [
          { id: "a1", name: "A1", image: "i" },
          { id: "a2", name: "A2", image: "i" },
        ],
      },
      buyer: {
        label: "Buyer",
        screens: [{ id: "b1", name: "B1", image: "i" }],
      },
    },
    transitions: [
      { from: "a1", to: "a2", label: "go" },
      { from: "a2", to: "b1", type: "modal" },
    ],
    ...overrides,
  });
}

describe("computeLayout", () => {
  it("returns positions for every screen", () => {
    const layout = computeLayout(makeConfig());
    const ids = layout.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["a1", "a2", "b1"]);
    for (const node of layout.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    }
  });

  it("returns one entry per group with color and label", () => {
    const layout = computeLayout(makeConfig());
    expect(layout.groups).toHaveLength(2);
    const admin = layout.groups.find((g) => g.id === "admin");
    expect(admin?.label).toBe("Admin");
    expect(admin?.color).toBe("#2563eb");
    const buyer = layout.groups.find((g) => g.id === "buyer");
    expect(buyer?.color).toBe("#6b7280");
  });

  it("returns edges with at least 2 points", () => {
    const layout = computeLayout(makeConfig());
    expect(layout.edges).toHaveLength(2);
    for (const edge of layout.edges) {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("preserves edge metadata (label, type)", () => {
    const layout = computeLayout(makeConfig());
    const labeled = layout.edges.find((e) => e.from === "a1" && e.to === "a2");
    expect(labeled?.label).toBe("go");
    expect(labeled?.type).toBe("default");
    const modal = layout.edges.find((e) => e.from === "a2" && e.to === "b1");
    expect(modal?.type).toBe("modal");
  });

  it("modal screens get smaller node dimensions than default", () => {
    const config = ConfigSchema.parse({
      title: "T",
      groups: {
        a: {
          label: "A",
          screens: [
            { id: "n", name: "N", image: "i" },
            { id: "m", name: "M", image: "i", type: "modal" },
          ],
        },
      },
    });
    const layout = computeLayout(config);
    const normal = layout.nodes.find((n) => n.id === "n");
    const modal = layout.nodes.find((n) => n.id === "m");
    expect(modal?.width).toBeLessThan(normal!.width);
    expect(modal?.height).toBeLessThan(normal!.height);
  });
});
