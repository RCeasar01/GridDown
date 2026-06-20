import bugOut15 from '../assets/content/flows/bug-out-15.json';
import shelterInPlace72 from '../assets/content/flows/shelter-in-place-72.json';
import vehicleBreakdown from '../assets/content/flows/vehicle-breakdown-remote.json';
import postStorm from '../assets/content/flows/post-storm-assessment.json';
import medicalNoEms from '../assets/content/flows/medical-no-ems.json';
import nuclearEmp from '../assets/content/flows/nuclear-emp-first-hour.json';

export interface FlowStep {
  step: number;
  title: string;
  summary: string;
  guideId: string | null;
  checklistItems: string[];
}

export interface Flow {
  id: string;
  title: string;
  icon: string;
  color: string;
  estimatedTime: string;
  description: string;
  steps: FlowStep[];
}

const ALL_FLOWS: Flow[] = [
  bugOut15 as Flow,
  shelterInPlace72 as Flow,
  vehicleBreakdown as Flow,
  postStorm as Flow,
  medicalNoEms as Flow,
  nuclearEmp as Flow,
];

export function getAllFlows(): Flow[] {
  return ALL_FLOWS;
}

export function getFlowById(id: string): Flow | undefined {
  return ALL_FLOWS.find(f => f.id === id);
}
