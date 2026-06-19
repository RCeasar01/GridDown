import { Guide } from '../db/contentLoader';

// Import all guide JSON files
import waterGuides from '../assets/content/water.json';
import fireGuides from '../assets/content/fire.json';
import shelterGuides from '../assets/content/shelter.json';
import foodGuides from '../assets/content/food.json';
import medicalGuides from '../assets/content/medical.json';
import navigationGuides from '../assets/content/navigation.json';
import commsGuides from '../assets/content/comms.json';
import securityGuides from '../assets/content/security.json';
import toolsGuides from '../assets/content/tools.json';
import disasterGuides from '../assets/content/disaster.json';

const ALL_GUIDES: Guide[] = [
  ...(waterGuides as Guide[]),
  ...(fireGuides as Guide[]),
  ...(shelterGuides as Guide[]),
  ...(foodGuides as Guide[]),
  ...(medicalGuides as Guide[]),
  ...(navigationGuides as Guide[]),
  ...(commsGuides as Guide[]),
  ...(securityGuides as Guide[]),
  ...(toolsGuides as Guide[]),
  ...(disasterGuides as Guide[]),
];

const GUIDE_MAP = new Map<string, Guide>(ALL_GUIDES.map((g) => [g.id, g]));

export function getAllGuides(): Guide[] {
  return ALL_GUIDES;
}

export function getGuideById(id: string): Guide | undefined {
  return GUIDE_MAP.get(id);
}

export function getGuidesByCategory(category: string): Guide[] {
  return ALL_GUIDES.filter((g) => g.category === category);
}
