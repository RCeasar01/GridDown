/**
 * engine.ts - Pure state machine for walking a triage tree.
 *
 * No React, no I/O: the screen holds a TriageSession in state and calls these
 * functions. Sessions are immutable - every call returns a new object - so
 * "Back" is just popping the path and the history is free to render as a log.
 */
import type { TriageNode, TriageTree } from './types';

export interface TriageSession {
  treeId: string;
  /** Node ids visited, in order. Last entry is the current node. */
  path: string[];
  /** Answers given at each question, keyed by node id (for the handoff log). */
  answers: Record<string, string>;
  startedAt: number;
}

export function startSession(tree: TriageTree, now = Date.now()): TriageSession {
  return { treeId: tree.id, path: [tree.startNode], answers: {}, startedAt: now };
}

export function getNode(tree: TriageTree, id: string): TriageNode {
  const node = tree.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Triage node "${id}" not found in ${tree.id}`);
  return node;
}

export function currentNode(tree: TriageTree, s: TriageSession): TriageNode {
  return getNode(tree, s.path[s.path.length - 1]);
}

/** Answer the current question with option `index`. */
export function choose(tree: TriageTree, s: TriageSession, index: number): TriageSession {
  const node = currentNode(tree, s);
  if (node.type !== 'question') throw new Error(`choose() called on ${node.type} node ${node.id}`);
  const option = node.options[index];
  if (!option) throw new Error(`Option ${index} does not exist on ${node.id}`);
  return {
    ...s,
    path: [...s.path, option.next],
    answers: { ...s.answers, [node.id]: option.label },
  };
}

/** Move past the current action node. */
export function advance(tree: TriageTree, s: TriageSession): TriageSession {
  const node = currentNode(tree, s);
  if (node.type !== 'action') throw new Error(`advance() called on ${node.type} node ${node.id}`);
  return { ...s, path: [...s.path, node.next] };
}

/** Undo the last step. No-op at the start node. */
export function back(s: TriageSession): TriageSession {
  if (s.path.length <= 1) return s;
  const path = s.path.slice(0, -1);
  const answers = { ...s.answers };
  delete answers[path[path.length - 1]];
  return { ...s, path, answers };
}

export function canGoBack(s: TriageSession): boolean {
  return s.path.length > 1;
}

export function isFinished(tree: TriageTree, s: TriageSession): boolean {
  return currentNode(tree, s).type === 'end';
}

/**
 * Plain-text record of what was done, for handing off to a medic or writing
 * on a casualty card. Times are relative to session start.
 */
export function handoffLog(tree: TriageTree, s: TriageSession): string {
  const lines = [`${tree.title} protocol (v${tree.version}), started ${new Date(s.startedAt).toLocaleTimeString()}`];
  s.path.forEach((id, i) => {
    const node = getNode(tree, id);
    const isCurrent = i === s.path.length - 1;
    if (node.type === 'question') {
      const a = s.answers[id];
      if (a) lines.push(`- ${node.prompt} ${a}`);
    } else if (node.type === 'action') {
      lines.push(`- ${isCurrent ? 'In progress' : 'Did'}: ${node.title}`);
    } else {
      lines.push(`- Result: ${node.title}`);
    }
  });
  return lines.join('\n');
}
