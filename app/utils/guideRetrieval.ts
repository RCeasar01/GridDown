/**
 * guideRetrieval.ts — finds the GridDown guides most relevant to a question so
 * Field Intelligence can answer from the app's own content instead of general
 * knowledge. Pure TypeScript, runs on-device, no embeddings or network.
 *
 * Scoring is BM25 over a small inverted index built once from the guide
 * registry (title, summary, tags, quickGlance, step titles/bodies, warnings).
 * Title and tag hits are weighted higher than body text.
 */
import type { Guide } from '../db/contentLoader';
import { getAllGuides } from './guideRegistry';

export interface RetrievedGuide {
  guide: Guide;
  score: number;
  /** Compact plain-text excerpt suitable for an LLM prompt. */
  excerpt: string;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'to', 'of', 'in', 'on', 'at', 'for', 'with',
  'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'do', 'does', 'did', 'can', 'could',
  'should', 'would', 'will', 'have', 'has', 'had', 'not', 'no', 'yes', 'there', 'here', 'about', 'into',
  'out', 'up', 'down', 'over', 'under', 'again', 'just', 'than', 'too', 'very', 'need', 'want', 'get',
  'got', 'some', 'any', 'all', 'one', 'also', 'much', 'many', 'know', 'tell', 'help', 'please',
]);

/** Lower-case, strip punctuation, drop stop words, crude stemming (plural / -ing / -ed). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .map(stem);
}

function stem(w: string): string {
  if (w.length <= 4) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

interface Doc {
  guide: Guide;
  tf: Map<string, number>;
  length: number;
}

interface Index {
  docs: Doc[];
  df: Map<string, number>;
  avgLength: number;
}

let index: Index | null = null;

const WEIGHT_TITLE = 3;
const WEIGHT_TAGS = 2.5;
const WEIGHT_SUMMARY = 1.5;
const WEIGHT_BODY = 1;

function guideText(g: Guide): Array<[string, number]> {
  const fields: Array<[string, number]> = [
    [g.title, WEIGHT_TITLE],
    [(g.tags ?? []).join(' '), WEIGHT_TAGS],
    [g.category, WEIGHT_TAGS],
    [g.summary ?? '', WEIGHT_SUMMARY],
  ];
  if (g.quickGlance) {
    fields.push([g.quickGlance.situation, WEIGHT_SUMMARY]);
    fields.push([g.quickGlance.immediate.join(' '), WEIGHT_BODY]);
    fields.push([g.quickGlance.then.join(' '), WEIGHT_BODY]);
  }
  for (const s of g.steps ?? []) {
    fields.push([s.title, WEIGHT_SUMMARY]);
    fields.push([s.body, WEIGHT_BODY]);
  }
  fields.push([(g.warnings ?? []).join(' '), WEIGHT_BODY]);
  return fields;
}

function buildIndex(guides: Guide[]): Index {
  const docs: Doc[] = [];
  const df = new Map<string, number>();
  let total = 0;
  for (const guide of guides) {
    const tf = new Map<string, number>();
    let length = 0;
    for (const [text, weight] of guideText(guide)) {
      for (const tok of tokenize(text)) {
        tf.set(tok, (tf.get(tok) ?? 0) + weight);
        length += weight;
      }
    }
    for (const tok of tf.keys()) df.set(tok, (df.get(tok) ?? 0) + 1);
    docs.push({ guide, tf, length });
    total += length;
  }
  return { docs, df, avgLength: docs.length ? total / docs.length : 1 };
}

/** Lazily build (and cache) the index. Exposed so tests can pass a custom guide set. */
export function getIndex(guides?: Guide[]): Index {
  if (guides) return buildIndex(guides);
  if (!index) index = buildIndex(getAllGuides());
  return index;
}

/** For tests / hot reload. */
export function resetIndex(): void {
  index = null;
}

const K1 = 1.4;
const B = 0.75;

function bm25(idx: Index, queryTokens: string[], doc: Doc): number {
  const n = idx.docs.length;
  let score = 0;
  for (const q of queryTokens) {
    const tf = doc.tf.get(q);
    if (!tf) continue;
    const df = idx.df.get(q) ?? 0;
    const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
    const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (doc.length / idx.avgLength)));
    score += idf * norm;
  }
  return score;
}

/** Build a compact excerpt (title, situation, first actions, key steps) under `maxChars`. */
export function buildExcerpt(g: Guide, maxChars = 900): string {
  const lines: string[] = [`GUIDE: ${g.title} (${g.category})`];
  if (g.quickGlance?.situation) lines.push(`Situation: ${g.quickGlance.situation}`);
  if (g.quickGlance?.immediate?.length) lines.push(`Do immediately: ${g.quickGlance.immediate.join('; ')}`);
  else if (g.summary) lines.push(g.summary);
  for (const s of g.steps ?? []) {
    const line = `${s.step}. ${s.title}: ${s.body}`;
    if (lines.join('\n').length + line.length > maxChars) break;
    lines.push(line);
  }
  if (g.warnings?.length) {
    const w = `WARNING: ${g.warnings[0]}`;
    if (lines.join('\n').length + w.length <= maxChars + 200) lines.push(w);
  }
  let out = lines.join('\n');
  if (out.length > maxChars + 200) out = out.slice(0, maxChars + 197) + '...';
  return out;
}

/**
 * Return the top-k guides for a free-text question. Guides scoring below
 * `minScore` (or below 25% of the best score) are dropped so irrelevant
 * questions return nothing rather than noise.
 */
export function retrieveGuides(
  query: string,
  opts: { k?: number; minScore?: number; guides?: Guide[]; excerptChars?: number } = {},
): RetrievedGuide[] {
  const { k = 3, minScore = 1.0, excerptChars = 900 } = opts;
  const queryTokens = Array.from(new Set(tokenize(query)));
  if (queryTokens.length === 0) return [];
  const idx = getIndex(opts.guides);
  const scored = idx.docs
    .map((doc) => ({ doc, score: bm25(idx, queryTokens, doc) }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return [];
  const floor = scored[0].score * 0.25;
  return scored
    .filter((s) => s.score >= floor)
    .slice(0, k)
    .map((s) => ({ guide: s.doc.guide, score: s.score, excerpt: buildExcerpt(s.doc.guide, excerptChars) }));
}
