import { describe, it, expect } from "vitest";
import { ConfigSchema } from "../src/core/schema.js";

const minimalGroups = {
  a: {
    label: "A",
    screens: [{ id: "s1", name: "Screen 1", image: "./s1.png" }],
  },
};

describe("ConfigSchema", () => {
  it("parses a minimal valid config", () => {
    const result = ConfigSchema.parse({
      title: "Test",
      groups: minimalGroups,
    });
    expect(result.title).toBe("Test");
    expect(result.transitions).toEqual([]);
  });

  it("applies defaults to layout and image", () => {
    const result = ConfigSchema.parse({
      title: "T",
      groups: minimalGroups,
    });
    expect(result.layout.direction).toBe("horizontal");
    expect(result.layout.spacing.group).toBe(200);
    expect(result.layout.spacing.node).toBe(80);
    expect(result.image.thumbnail_width).toBe(600);
    expect(result.image.original_width).toBe(2000);
    expect(result.image.quality).toBe(80);
    expect(result.image.format).toBe("webp");
  });

  it("applies screen.type default to 'default'", () => {
    const result = ConfigSchema.parse({
      title: "T",
      groups: minimalGroups,
    });
    expect(result.groups.a?.screens[0]?.type).toBe("default");
  });

  it("rejects empty groups", () => {
    expect(() =>
      ConfigSchema.parse({ title: "T", groups: {} }),
    ).toThrow();
  });

  it("rejects missing title", () => {
    expect(() =>
      ConfigSchema.parse({ groups: minimalGroups }),
    ).toThrow();
  });

  it("rejects empty screens array", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        groups: { a: { label: "A", screens: [] } },
      }),
    ).toThrow();
  });

  it("rejects invalid HEX color", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        groups: {
          a: { label: "A", color: "not-a-hex", screens: minimalGroups.a.screens },
        },
      }),
    ).toThrow();
  });

  it("accepts 3- and 6-char HEX colors", () => {
    for (const color of ["#abc", "#abcdef", "#123", "#FFFFFF"]) {
      expect(() =>
        ConfigSchema.parse({
          title: "T",
          groups: {
            a: { label: "A", color, screens: minimalGroups.a.screens },
          },
        }),
      ).not.toThrow();
    }
  });

  it("rejects quality outside 1-100", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        image: { quality: 200 },
        groups: minimalGroups,
      }),
    ).toThrow();
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        image: { quality: 0 },
        groups: minimalGroups,
      }),
    ).toThrow();
  });

  it("rejects invalid direction", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        layout: { direction: "diagonal" },
        groups: minimalGroups,
      }),
    ).toThrow();
  });

  it("rejects invalid format", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        image: { format: "gif" },
        groups: minimalGroups,
      }),
    ).toThrow();
  });

  it("accepts modal screen and transition types", () => {
    const result = ConfigSchema.parse({
      title: "T",
      groups: {
        a: {
          label: "A",
          screens: [
            { id: "s1", name: "S1", image: "./i" },
            { id: "s2", name: "S2", image: "./i", type: "modal" },
          ],
        },
      },
      transitions: [{ from: "s1", to: "s2", type: "modal", label: "open" }],
    });
    expect(result.groups.a?.screens[1]?.type).toBe("modal");
    expect(result.transitions[0]?.type).toBe("modal");
  });

  it("accepts email transition type", () => {
    const result = ConfigSchema.parse({
      title: "T",
      groups: minimalGroups,
      transitions: [
        { from: "s1", to: "s1", type: "email", label: "send" },
      ],
    });
    expect(result.transitions[0]?.type).toBe("email");
  });

  it("rejects unknown transition type", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        groups: minimalGroups,
        transitions: [{ from: "s1", to: "s1", type: "webhook" }],
      }),
    ).toThrow();
  });

  it("accepts transition with icon field", () => {
    const result = ConfigSchema.parse({
      title: "T",
      groups: minimalGroups,
      transitions: [{ from: "s1", to: "s1", icon: "bell" }],
    });
    expect(result.transitions[0]?.icon).toBe("bell");
  });

  it("accepts screen.position with x/y", () => {
    const result = ConfigSchema.parse({
      title: "T",
      groups: {
        a: {
          label: "A",
          screens: [
            {
              id: "s1",
              name: "S1",
              image: "./i",
              position: { x: 100, y: 200 },
            },
          ],
        },
      },
    });
    expect(result.groups.a?.screens[0]?.position).toEqual({ x: 100, y: 200 });
  });

  it("rejects screen.position without x or y", () => {
    expect(() =>
      ConfigSchema.parse({
        title: "T",
        groups: {
          a: {
            label: "A",
            screens: [
              { id: "s1", name: "S1", image: "./i", position: { x: 100 } },
            ],
          },
        },
      }),
    ).toThrow();
  });
});
