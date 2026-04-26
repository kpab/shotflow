import { z } from "zod";

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: "must be a HEX color like #RRGGBB or #RGB",
  });

const ScreenType = z.enum(["default", "modal"]);
const TransitionType = z.enum(["default", "modal", "email"]);
const Direction = z.enum(["horizontal", "vertical"]);
const ImageFormat = z.enum(["webp", "jpeg", "png"]);

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ScreenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string().min(1),
  type: ScreenType.default("default"),
  description: z.string().optional(),
  position: PositionSchema.optional(),
});

export const GroupSchema = z.object({
  label: z.string().min(1),
  color: HexColor.optional(),
  screens: z.array(ScreenSchema).min(1),
});

export const TransitionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  type: TransitionType.default("default"),
  icon: z.string().min(1).optional(),
});

export const LayoutConfigSchema = z
  .object({
    direction: Direction.default("horizontal"),
    groups: z.array(z.string()).optional(),
    spacing: z
      .object({
        group: z.number().positive().default(200),
        node: z.number().positive().default(80),
      })
      .prefault({}),
  })
  .prefault({});

export const ImageConfigSchema = z
  .object({
    thumbnail_width: z.number().positive().default(600),
    original_width: z.number().positive().default(2000),
    quality: z.number().min(1).max(100).default(80),
    format: ImageFormat.default("webp"),
  })
  .prefault({});

export const ConfigSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  layout: LayoutConfigSchema,
  image: ImageConfigSchema,
  groups: z
    .record(z.string(), GroupSchema)
    .refine((g) => Object.keys(g).length > 0, {
      message: "groups must contain at least one group",
    }),
  transitions: z.array(TransitionSchema).default([]),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Screen = z.infer<typeof ScreenSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type ImageConfig = z.infer<typeof ImageConfigSchema>;
