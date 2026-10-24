/**
 * quizCategories.ts — the quiz menu's category tiles, derived from the quizzes
 * that actually ship (so counts are never stale and a category with no quizzes
 * never shows). Order follows the library's category order; the Field Manuals
 * group, which is not a guide category, goes last.
 */
import { CATEGORY_LIST, CATEGORY_LABELS, CATEGORY_ICONS } from '../content/categories';
import { getAllQuizzes } from './quizRegistry';

export interface QuizCategoryTile {
  id: string;
  label: string;
  icon: string;
  count: number;
}

const EXTRA_GROUPS: Record<string, { label: string; icon: string }> = {
  'field-manual': { label: 'Field Manuals', icon: 'book-outline' },
};

export function getQuizCategoryTiles(): QuizCategoryTile[] {
  const counts = new Map<string, number>();
  for (const q of getAllQuizzes()) counts.set(q.category, (counts.get(q.category) ?? 0) + 1);

  const tiles: QuizCategoryTile[] = [];
  for (const c of CATEGORY_LIST) {
    const n = counts.get(c.id) ?? 0;
    if (n > 0) tiles.push({ id: c.id, label: c.label, icon: c.icon, count: n });
  }
  for (const [id, n] of counts) {
    if (CATEGORY_LABELS[id] || n === 0) continue;
    const extra = EXTRA_GROUPS[id];
    tiles.push({ id, label: extra?.label ?? id, icon: extra?.icon ?? CATEGORY_ICONS[id] ?? 'help-circle-outline', count: n });
  }
  return tiles;
}
