import { Guide } from '../db/contentLoader';

// Core categories
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

// New categories (v1.1)
import vehicleGuides from '../assets/content/vehicle.json';
import homesteadingGuides from '../assets/content/homesteading.json';

// Field Manuals (public domain US Army)
import fm001 from '../assets/content/field-manuals/fm-001.json';
import fm002 from '../assets/content/field-manuals/fm-002.json';
import fm003 from '../assets/content/field-manuals/fm-003.json';
import fm004 from '../assets/content/field-manuals/fm-004.json';
import fm005 from '../assets/content/field-manuals/fm-005.json';

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
  ...(vehicleGuides as Guide[]),
  ...(homesteadingGuides as Guide[]),
  ...(fm001 as Guide[]),
  ...(fm002 as Guide[]),
  ...(fm003 as Guide[]),
  ...(fm004 as Guide[]),
  ...(fm005 as Guide[]),
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

export function getFieldManuals(): Guide[] {
  return ALL_GUIDES.filter((g) => g.tags && g.tags.includes('field-manual'));
}
