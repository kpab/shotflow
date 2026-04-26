import dagre from "dagre";
import type { Config, Screen } from "./schema.js";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 140;
const MODAL_WIDTH = 150;
const MODAL_HEIGHT = 120;

export interface LayoutNode {
  id: string;
  groupId: string;
  type: "default" | "modal";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
  label?: string;
  type: "default" | "modal";
  points: { x: number; y: number }[];
}

export interface LayoutGroup {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout {
  width: number;
  height: number;
  groups: LayoutGroup[];
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

function nodeSize(screen: Screen): { width: number; height: number } {
  return screen.type === "modal"
    ? { width: MODAL_WIDTH, height: MODAL_HEIGHT }
    : { width: NODE_WIDTH, height: NODE_HEIGHT };
}

export function computeLayout(config: Config): Layout {
  const direction = config.layout.direction;
  const nodeSpacing = config.layout.spacing.node;

  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: direction === "horizontal" ? "LR" : "TB",
    ranksep: nodeSpacing,
    nodesep: nodeSpacing,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const [groupId, group] of Object.entries(config.groups)) {
    g.setNode(groupId, { label: group.label });
  }

  const screenInfo = new Map<string, { groupId: string; screen: Screen }>();
  for (const [groupId, group] of Object.entries(config.groups)) {
    for (const screen of group.screens) {
      const { width, height } = nodeSize(screen);
      g.setNode(screen.id, { width, height });
      g.setParent(screen.id, groupId);
      screenInfo.set(screen.id, { groupId, screen });
    }
  }

  for (const t of config.transitions) {
    g.setEdge(t.from, t.to, { label: t.label });
  }

  dagre.layout(g);

  const nodes: LayoutNode[] = [];
  for (const id of g.nodes()) {
    const info = screenInfo.get(id);
    if (!info) continue;
    const n = g.node(id);
    nodes.push({
      id,
      groupId: info.groupId,
      type: info.screen.type,
      name: info.screen.name,
      x: n.x - n.width / 2,
      y: n.y - n.height / 2,
      width: n.width,
      height: n.height,
    });
  }

  const groups: LayoutGroup[] = [];
  for (const [groupId, cfg] of Object.entries(config.groups)) {
    const cluster = g.node(groupId);
    if (!cluster) continue;
    groups.push({
      id: groupId,
      label: cfg.label,
      color: cfg.color ?? "#6b7280",
      x: cluster.x - cluster.width / 2,
      y: cluster.y - cluster.height / 2,
      width: cluster.width,
      height: cluster.height,
    });
  }

  const edges: LayoutEdge[] = [];
  for (const t of config.transitions) {
    const e = g.edge({ v: t.from, w: t.to });
    if (!e?.points) continue;
    edges.push({
      from: t.from,
      to: t.to,
      label: t.label,
      type: t.type,
      points: e.points.map((p) => ({ x: p.x, y: p.y })),
    });
  }

  const graphInfo = g.graph();
  const width = graphInfo.width ?? 0;
  const height = graphInfo.height ?? 0;

  return { width, height, groups, nodes, edges };
}
