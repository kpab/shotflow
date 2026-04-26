export { parseConfig } from "./core/parser.js";
export { render, type RenderOptions } from "./core/renderer.js";
export {
  build,
  buildFromObject,
  type BuildOptions,
  type BuildFromObjectOptions,
  type BuildRenderOptions,
} from "./core/build.js";
export {
  ConfigSchema,
  ScreenSchema,
  GroupSchema,
  TransitionSchema,
  LayoutConfigSchema,
  ImageConfigSchema,
  type Config,
  type Screen,
  type Group,
  type Transition,
  type LayoutConfig,
  type ImageConfig,
} from "./core/schema.js";

export const VERSION = "0.0.0";
