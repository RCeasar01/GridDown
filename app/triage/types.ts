/**
 * types.ts - Triage decision trees.
 *
 * A triage tree is a deterministic, branching protocol for a life-threatening
 * situation (severe bleeding, CPR, hypothermia...). Unlike the AI advisor, a tree
 * gives the SAME answer every time, works on every phone, and never improvises.
 * The advisor may route the user INTO a tree; it never generates content inside one.
 *
 * Content lives in app/assets/content/triage/*.json and must pass validateTree().
 */

/** A node that asks the user something and branches on the answer. */
export interface QuestionNode {
  type: 'question';
  id: string;
  /** Short, plain-language question. Answerable at a glance under stress. */
  prompt: string;
  /** Optional one-line hint on how to tell (e.g. "Look for spurting or pooling blood"). */
  help?: string;
  options: Array<{ label: string; next: string }>;
}

/** A node that tells the user what to do, then moves on. */
export interface ActionNode {
  type: 'action';
  id: string;
  title: string;
  /** Ordered steps. Imperative voice, one action per line. */
  steps: string[];
  /** Things NOT to do. Shown in a warning box. */
  doNot?: string[];
  /** Optional link to a full GridDown guide for depth. */
  guideId?: string;
  /** Optional timer the UI can offer (e.g. hold pressure 3 minutes). */
  timerSeconds?: number;
  /** Label for the continue button. Defaults to "Done - next". */
  continueLabel?: string;
  next: string;
}

/** A terminal node. Every path through a tree must reach one. */
export interface EndNode {
  type: 'end';
  id: string;
  title: string;
  /** What to keep doing now (monitoring, reassessment, evacuation). */
  steps: string[];
  /** Severity of the end state - drives color in the UI. */
  outcome: 'stable' | 'monitor' | 'evacuate' | 'critical';
  guideId?: string;
  /** Hand off to another tree (e.g. hypothermia -> CPR). */
  switchToTree?: string;
}

export type TriageNode = QuestionNode | ActionNode | EndNode;

export type ReviewStatus = 'draft' | 'reviewed';

export interface TriageTree {
  id: string;
  title: string;
  /** One line shown on the protocol card. */
  summary: string;
  icon: string;
  /** Schema version of this file. Bump when the structure changes. */
  schemaVersion: 1;
  /** Content version. Bump on any wording or logic change. */
  version: string;
  /** Public guidance this tree is based on. Required. */
  sources: string[];
  /**
   * 'draft' trees appear ONLY in development builds. A tree must be reviewed by
   * a qualified clinician (EMT-P, RN, PA, MD, or WFR instructor) before it ships.
   */
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedOn?: string;
  /** Always shown first, before the first node (e.g. "Call 911 if you can"). */
  firstLine: string;
  startNode: string;
  nodes: TriageNode[];
}
