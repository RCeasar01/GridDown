/**
 * validate.ts - Structural checks for triage trees.
 *
 * A broken tree in an emergency is worse than no tree, so every tree is checked
 * in CI (__tests__/triage.test.ts) and the registry refuses invalid trees at runtime.
 *
 * Checks: required fields, unique node ids, every `next` points at a real node,
 * every node is reachable from the start, and every node can reach an end node
 * (no dead loops that trap the user).
 */
import type { TriageNode, TriageTree } from './types';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function nextIds(node: TriageNode): string[] {
  if (node.type === 'question') return node.options.map((o) => o.next);
  if (node.type === 'action') return [node.next];
  return [];
}

/**
 * @param knownTreeIds ids of all trees in the app, used to check `switchToTree`.
 */
export function validateTree(tree: TriageTree, knownTreeIds: string[] = []): ValidationResult {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`[${tree?.id ?? '?'}] ${msg}`);

  if (!tree || typeof tree !== 'object') return { ok: false, errors: ['tree is not an object'] };
  if (!tree.id) err('missing id');
  if (!tree.title) err('missing title');
  if (!tree.firstLine) err('missing firstLine');
  if (tree.schemaVersion !== 1) err(`unsupported schemaVersion ${String(tree.schemaVersion)}`);
  if (!tree.version) err('missing version');
  if (!Array.isArray(tree.sources) || tree.sources.length === 0) err('sources must list at least one public source');
  if (tree.reviewStatus !== 'draft' && tree.reviewStatus !== 'reviewed') err('reviewStatus must be draft or reviewed');
  if (tree.reviewStatus === 'reviewed' && (!tree.reviewedBy || !tree.reviewedOn)) {
    err('reviewed trees must record reviewedBy and reviewedOn');
  }
  if (!Array.isArray(tree.nodes) || tree.nodes.length === 0) {
    err('no nodes');
    return { ok: false, errors };
  }

  const byId = new Map<string, TriageNode>();
  for (const n of tree.nodes) {
    if (!n.id) err('node without id');
    else if (byId.has(n.id)) err(`duplicate node id "${n.id}"`);
    else byId.set(n.id, n);

    if (n.type === 'question') {
      if (!n.prompt) err(`${n.id}: question without prompt`);
      if (!Array.isArray(n.options) || n.options.length < 2) err(`${n.id}: question needs at least 2 options`);
      for (const o of n.options ?? []) if (!o.label) err(`${n.id}: option without label`);
    } else if (n.type === 'action') {
      if (!n.title) err(`${n.id}: action without title`);
      if (!Array.isArray(n.steps) || n.steps.length === 0) err(`${n.id}: action without steps`);
      if (n.timerSeconds !== undefined && !(n.timerSeconds > 0)) err(`${n.id}: timerSeconds must be > 0`);
    } else if (n.type === 'end') {
      if (!n.title) err(`${n.id}: end without title`);
      if (!Array.isArray(n.steps)) err(`${n.id}: end steps must be an array`);
      if (!['stable', 'monitor', 'evacuate', 'critical'].includes(n.outcome)) err(`${n.id}: bad outcome`);
      if (n.switchToTree && knownTreeIds.length && !knownTreeIds.includes(n.switchToTree)) {
        err(`${n.id}: switchToTree "${n.switchToTree}" is not a known tree`);
      }
    } else {
      err(`node "${(n as TriageNode).id}" has unknown type`);
    }
  }

  if (!byId.has(tree.startNode)) err(`startNode "${tree.startNode}" does not exist`);

  for (const n of byId.values()) {
    for (const next of nextIds(n)) {
      if (!byId.has(next)) err(`${n.id}: next "${next}" does not exist`);
    }
  }

  // Reachability from start.
  const reachable = new Set<string>();
  const stack = byId.has(tree.startNode) ? [tree.startNode] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const node = byId.get(id);
    if (node) for (const next of nextIds(node)) if (byId.has(next)) stack.push(next);
  }
  for (const id of byId.keys()) if (!reachable.has(id)) err(`${id}: unreachable from start`);

  // Every node must be able to reach an end (reverse search from end nodes).
  const canFinish = new Set<string>([...byId.values()].filter((n) => n.type === 'end').map((n) => n.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of byId.values()) {
      if (canFinish.has(n.id)) continue;
      if (nextIds(n).some((id) => canFinish.has(id))) {
        canFinish.add(n.id);
        changed = true;
      }
    }
  }
  for (const id of byId.keys()) if (!canFinish.has(id)) err(`${id}: can never reach an end node`);

  return { ok: errors.length === 0, errors };
}
