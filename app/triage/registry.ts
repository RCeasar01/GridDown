/**
 * registry.ts - Loads, validates, and gates triage trees.
 *
 * Release gate: trees with reviewStatus "draft" are visible ONLY in development
 * builds (__DEV__). A tree ships to users after a qualified clinician reviews it
 * and its JSON is updated to reviewStatus "reviewed" with reviewedBy/reviewedOn.
 * Invalid trees are dropped (and logged) rather than shown half-broken.
 */
import type { TriageTree } from './types';
import { validateTree } from './validate';

import severeBleeding from '../assets/content/triage/severe-bleeding.json';
import unresponsiveCpr from '../assets/content/triage/unresponsive-cpr.json';
import hypothermia from '../assets/content/triage/hypothermia.json';
import heatIllness from '../assets/content/triage/heat-illness.json';
import snakebite from '../assets/content/triage/snakebite.json';

/** Every tree in the app, in menu order, before gating. Exported for tests. */
export const ALL_TREES: TriageTree[] = [
  severeBleeding as TriageTree,
  unresponsiveCpr as TriageTree,
  hypothermia as TriageTree,
  heatIllness as TriageTree,
  snakebite as TriageTree,
];

const ALL_IDS = ALL_TREES.map((t) => t.id);

function isDevBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

let cache: TriageTree[] | null = null;

/** Trees the current build may show: valid, and reviewed (or any status in dev). */
export function getAvailableTrees(opts: { includeDrafts?: boolean } = {}): TriageTree[] {
  const includeDrafts = opts.includeDrafts ?? isDevBuild();
  if (cache && opts.includeDrafts === undefined) return cache;
  const out = ALL_TREES.filter((t) => {
    const result = validateTree(t, ALL_IDS);
    if (!result.ok) {
      console.warn(`[triage] dropping invalid tree ${t.id}:\n${result.errors.join('\n')}`);
      return false;
    }
    return includeDrafts || t.reviewStatus === 'reviewed';
  });
  if (opts.includeDrafts === undefined) cache = out;
  return out;
}

export function getTreeById(id: string): TriageTree | undefined {
  return getAvailableTrees().find((t) => t.id === id);
}
