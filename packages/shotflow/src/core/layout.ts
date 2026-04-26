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
  type: "default" | "modal" | "email";
  icon?: string;
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
  const overrides = new Map<string, { x: number; y: number }>();
  for (const id of g.nodes()) {
    const info = screenInfo.get(id);
    if (!info) continue;
    const n = g.node(id);
    const pos = info.screen.position;
    if (pos) overrides.set(id, pos);
    nodes.push({
      id,
      groupId: info.groupId,
      type: info.screen.type,
      name: info.screen.name,
      x: pos ? pos.x : n.x - n.width / 2,
      y: pos ? pos.y : n.y - n.height / 2,
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

  if (overrides.size > 0) {
    const margin = 24;
    for (const group of groups) {
      const members = nodes.filter((n) => n.groupId === group.id);
      if (members.length === 0) continue;
      const minX = Math.min(...members.map((n) => n.x));
      const minY = Math.min(...members.map((n) => n.y));
      const maxX = Math.max(...members.map((n) => n.x + n.width));
      const maxY = Math.max(...members.map((n) => n.y + n.height));
      group.x = minX - margin;
      group.y = minY - margin;
      group.width = maxX - minX + margin * 2;
      group.height = maxY - minY + margin * 2;
    }
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges: LayoutEdge[] = [];
  for (const t of config.transitions) {
    const e = g.edge({ v: t.from, w: t.to });
    if (!e?.points) continue;
    let points = e.points.map((p) => ({ x: p.x, y: p.y }));
    if (overrides.has(t.from) || overrides.has(t.to)) {
      const fromN = nodeById.get(t.from);
      const toN = nodeById.get(t.to);
      if (fromN && toN) {
        const fromCenter = {
          x: fromN.x + fromN.width / 2,
          y: fromN.y + fromN.height / 2,
        };
        const toCenter = {
          x: toN.x + toN.width / 2,
          y: toN.y + toN.height / 2,
        };
        points = [
          intersectBbox(fromN, toCenter),
          intersectBbox(toN, fromCenter),
        ];
      }
    }
    edges.push({
      from: t.from,
      to: t.to,
      label: t.label,
      type: t.type,
      icon: t.icon,
      points,
    });
  }

  const graphInfo = g.graph();
  let width = graphInfo.width ?? 0;
  let height = graphInfo.height ?? 0;
  if (overrides.size > 0) {
    width = Math.max(width, ...nodes.map((n) => n.x + n.width));
    height = Math.max(height, ...nodes.map((n) => n.y + n.height));
    width = Math.max(width, ...groups.map((g) => g.x + g.width));
    height = Math.max(height, ...groups.map((g) => g.y + g.height));
  }

  return { width, height, groups, nodes, edges };
}

function intersectBbox(
  node: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number },
): { x: number; y: number } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfW = node.width / 2;
  const halfH = node.height / 2;
  const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
  const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: cx + dx * t, y: cy + dy * t };
}
