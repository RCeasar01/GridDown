import { Guide } from '../db/contentLoader';

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#E8642A';
    case 'advanced': return '#D4A017';
    case 'beginner': return '#4A7C59';
    default: return '#888888';
  }
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case 'critical': return 'CRITICAL';
    case 'advanced': return 'ADVANCED';
    case 'beginner': return 'BEGINNER';
    default: return priority.toUpperCase();
  }
}

export function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    water: '💧',
    fire: '🔥',
    shelter: '🏕️',
    food: '🌿',
    medical: '🩹',
    navigation: '🧭',
    comms: '📡',
    security: '🛡️',
    tools: '🔧',
    disaster: '⚠️',
    vehicle: '🚗',
    homesteading: '🌾',
    power: '⚡',
    urban: '🏙️',
    leadership: '🎖️',
    children: '👧',
  };
  return icons[category] ?? '📋';
}

export function categoryDescription(category: string): string {
  const desc: Record<string, string> = {
    water: 'Finding, purifying, and storing water when infrastructure fails.',
    fire: 'Starting and maintaining fire in adverse conditions.',
    shelter: 'Building protection from the elements with available materials.',
    food: 'Sourcing, identifying, and preserving food without resupply.',
    medical: 'Trauma care, disease prevention, and long-term patient management.',
    navigation: 'Moving with purpose when GPS and maps are unavailable.',
    comms: 'Signaling, radio operation, and communication protocols.',
    security: 'Threat assessment, perimeter, and bug-out planning.',
    tools: 'Essential gear, improvised tools, and maintenance.',
    disaster: 'Specific response protocols for natural and man-made disasters.',
    vehicle: 'Field repairs, fuel, generators, and mechanical troubleshooting.',
    homesteading: 'Chickens, crops, food preservation, and water collection.',
    power: 'Solar, batteries, generators, and off-grid power distribution.',
    urban: 'Surviving in cities when infrastructure and services collapse.',
    leadership: 'Crisis leadership, psychology, and group decision-making.',
    children: 'Age-appropriate safety skills for kids and parents.',
  };
  return desc[category] ?? 'Survival knowledge for grid-down scenarios.';
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

export function searchGuides(guides: Guide[], query: string): Guide[] {
  if (!query.trim()) return guides;
  const q = query.toLowerCase();
  return guides.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q)) ||
      g.category.toLowerCase().includes(q),
  );
}
