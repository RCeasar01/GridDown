/**
 * Human labels for internal enums. Raw values such as `multiple_choice` must never reach the
 * screen (the Drill badge once showed MULTIPLE_CHOICE with the underscore).
 */
const QUIZ_FORMATS: Record<string, string> = {
  multiple_choice: 'Multiple choice',
  priority_order: 'Priority order',
  decision_tree: 'Decision tree',
};

export function formatQuizFormat(format: string): string {
  return QUIZ_FORMATS[format] ?? titleCase(format);
}

/** `heat_stroke-care` → `Heat Stroke Care`. */
export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
