/**
 * GridDown Offline Search Engine
 * Builds an in-memory index from all guide JSONs on first access.
 * Singleton — index is built once and reused.
 */

import { Guide } from '../db/contentLoader';
import { getAllGuides } from './guideRegistry';

interface SearchIndexEntry {
  id: string;
  category: string;
  title: string;
  titleLower: string;
  summary: string;
  summaryLower: string;
  tags: string[];
  tagsLower: string[];
  priority: string;
}

interface SearchResult {
  guide: Guide;
  score: number;
}

export interface GroupedResults {
  category: string;
  guides: Guide[];
}

let _index: SearchIndexEntry[] | null = null;
let _guideMap: Map<string, Guide> | null = null;

function buildIndex(): void {
  if (_index !== null) return;
  const guides = getAllGuides();
  _guideMap = new Map(guides.map((g) => [g.id, g]));
  _index = guides.map((g) => ({
    id: g.id,
    category: g.category,
    title: g.title,
    titleLower: g.title.toLowerCase(),
    summary: g.summary,
    summaryLower: g.summary.toLowerCase(),
    tags: g.tags,
    tagsLower: g.tags.map((t) => t.toLowerCase()),
    priority: g.priority,
  }));
}

export function searchGuides(query: string): Guide[] {
  if (!query.trim()) return [];
  buildIndex();
  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const entry of _index!) {
    let score = 0;

    // Title match — highest weight
    if (entry.titleLower === q) {
      score += 100;
    } else if (entry.titleLower.startsWith(q)) {
      score += 60;
    } else if (entry.titleLower.includes(q)) {
      score += 40;
    }

    // Tag match — high weight
    if (entry.tagsLower.some((t) => t === q)) {
      score += 50;
    } else if (entry.tagsLower.some((t) => t.includes(q))) {
      score += 25;
    }

    // Summary match — medium weight
    if (entry.summaryLower.includes(q)) {
      score += 20;
    }

    // Priority boost — surface critical guides first
    if (score > 0) {
      if (entry.priority === 'critical') score += 10;
      else if (entry.priority === 'advanced') score += 5;
      results.push({ guide: _guideMap!.get(entry.id)!, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((r) => r.guide);
}

export function searchGroupedByCategory(query: string): GroupedResults[] {
  const guides = searchGuides(query);
  const grouped: Map<string, Guide[]> = new Map();

  for (const guide of guides) {
    if (!grouped.has(guide.category)) {
      grouped.set(guide.category, []);
    }
    grouped.get(guide.category)!.push(guide);
  }

  return Array.from(grouped.entries()).map(([category, categoryGuides]) => ({
    category,
    guides: categoryGuides,
  }));
}

export function invalidateIndex(): void {
  _index = null;
  _guideMap = null;
}
