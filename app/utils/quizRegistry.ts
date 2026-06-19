import { Quiz } from '../types/quiz';

import waterQuizzes from '../assets/content/quizzes/water-quizzes.json';
import fireQuizzes from '../assets/content/quizzes/fire-quizzes.json';
import shelterQuizzes from '../assets/content/quizzes/shelter-quizzes.json';
import foodQuizzes from '../assets/content/quizzes/food-quizzes.json';
import medicalQuizzes from '../assets/content/quizzes/medical-quizzes.json';
import navigationQuizzes from '../assets/content/quizzes/navigation-quizzes.json';
import commsQuizzes from '../assets/content/quizzes/comms-quizzes.json';
import securityQuizzes from '../assets/content/quizzes/security-quizzes.json';
import vehicleQuizzes from '../assets/content/quizzes/vehicle-quizzes.json';
import homesteadingQuizzes from '../assets/content/quizzes/homesteading-quizzes.json';
import fieldManualQuizzes from '../assets/content/quizzes/field-manual-quizzes.json';
import disasterQuizzes from '../assets/content/quizzes/disaster-quizzes.json';

const ALL_QUIZZES: Quiz[] = [
  ...(waterQuizzes as unknown as Quiz[]),
  ...(fireQuizzes as unknown as Quiz[]),
  ...(shelterQuizzes as unknown as Quiz[]),
  ...(foodQuizzes as unknown as Quiz[]),
  ...(medicalQuizzes as unknown as Quiz[]),
  ...(navigationQuizzes as unknown as Quiz[]),
  ...(commsQuizzes as unknown as Quiz[]),
  ...(securityQuizzes as unknown as Quiz[]),
  ...(vehicleQuizzes as unknown as Quiz[]),
  ...(homesteadingQuizzes as unknown as Quiz[]),
  ...(fieldManualQuizzes as unknown as Quiz[]),
  ...(disasterQuizzes as unknown as Quiz[]),
];

export function getAllQuizzes(): Quiz[] { return ALL_QUIZZES; }
export function getQuizzesByCategory(category: string): Quiz[] {
  return ALL_QUIZZES.filter(q => q.category === category);
}
export function getQuizById(id: string): Quiz | undefined {
  return ALL_QUIZZES.find(q => q.id === id);
}
