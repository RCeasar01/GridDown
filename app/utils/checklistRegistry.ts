import { Checklist } from '../db/contentLoader';

import hurricaneData from '../assets/checklists/hurricane.json';
import tornadoData from '../assets/checklists/tornado.json';
import earthquakeData from '../assets/checklists/earthquake.json';
import floodData from '../assets/checklists/flood.json';
import empData from '../assets/checklists/emp.json';
import nuclearData from '../assets/checklists/nuclear.json';

const ALL_CHECKLISTS: Checklist[] = [
  hurricaneData as Checklist,
  tornadoData as Checklist,
  earthquakeData as Checklist,
  floodData as Checklist,
  empData as Checklist,
  nuclearData as Checklist,
];

export function getAllChecklists(): Checklist[] {
  return ALL_CHECKLISTS;
}

export function getChecklistById(id: string): Checklist | undefined {
  return ALL_CHECKLISTS.find((c) => c.id === id);
}

export function getChecklistByType(disasterType: string): Checklist | undefined {
  return ALL_CHECKLISTS.find((c) => c.disasterType === disasterType);
}
