import { getLatestReadinessScan } from '../db/readinessScan';
// Note: use try/catch imports for anything that might not exist yet

export type PrepLevelId = 1 | 2 | 3 | 4 | 5 | 6;

export interface PrepLevel {
  id: PrepLevelId;
  name: string;
  description: string;
  icon: string; // Ionicons name
  color: string;
  requirements: string[];
}

export const PREP_LEVELS: PrepLevel[] = [
  {
    id: 1,
    name: 'Civilian',
    description: 'Starting point — awareness without preparation',
    icon: 'person-outline',
    color: '#888888',
    requirements: [],
  },
  {
    id: 2,
    name: 'Prepared Citizen',
    description: 'Basic readiness — completed onboarding and started training',
    icon: 'shield-outline',
    color: '#4A7C59',
    requirements: ['Complete Readiness Scan', 'Complete 5 training quizzes'],
  },
  {
    id: 3,
    name: 'Advanced Prepared Citizen',
    description: 'Solid foundation across all readiness domains',
    icon: 'shield-half',
    color: '#4A7C59',
    requirements: ['50%+ readiness on all scan categories', 'Complete 6 checklists'],
  },
  {
    id: 4,
    name: 'Community Leader',
    description: 'Ready to lead and support others in crisis',
    icon: 'star-outline',
    color: '#D4A017',
    requirements: ['75%+ overall readiness score', '30-day training streak'],
  },
  {
    id: 5,
    name: 'Responder',
    description: 'High proficiency across all critical domains',
    icon: 'medal-outline',
    color: '#E8642A',
    requirements: ['90%+ overall readiness score', 'All advanced quizzes passed'],
  },
  {
    id: 6,
    name: 'Survival Expert',
    description: 'Maximum readiness — 100% across all systems',
    icon: 'trophy',
    color: '#E8642A',
    requirements: ['100% readiness scan', 'All quizzes passed', 'Gear Inventory complete'],
  },
];

export interface PrepLevelStatus {
  currentLevel: PrepLevel;
  nextLevel: PrepLevel | null;
  progressToNext: number; // 0-100
  missingRequirements: string[];
}

/**
 * Calculate the user's current preparedness level from available data.
 * This is intentionally defensive — if data isn't available, defaults to level 1.
 */
export async function calculatePrepLevel(): Promise<PrepLevelStatus> {
  try {
    // Try to get readiness scan
    let overallScore = 0;
    let allCategoriesAbove50 = false;
    let allCategoriesAbove75 = false;
    let allCategoriesAbove90 = false;
    let scanComplete = false;

    try {
      const scan = await getLatestReadinessScan();
      if (scan) {
        overallScore = scan.overall_score;
        scanComplete = true;
        const domainScores = [
          scan.water_score, scan.shelter_score, scan.medical_score,
          scan.comms_score, scan.power_score, scan.navigation_score, scan.planning_score
        ];
        allCategoriesAbove50 = domainScores.every(s => s >= 50);
        allCategoriesAbove75 = domainScores.every(s => s >= 75);
        allCategoriesAbove90 = domainScores.every(s => s >= 90);
      }
    } catch { /* scan not available */ }

    // Try to get quiz count from SQLite
    let quizCount = 0;
    try {
      const { default: SQLite } = await import('expo-sqlite');
      const db = await SQLite.openDatabaseAsync('griddown.db');
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(DISTINCT quiz_id) as count FROM quiz_results WHERE correct = 1'
      );
      quizCount = result?.count ?? 0;
    } catch { /* quiz data not available */ }

    // Determine level
    let levelId: PrepLevelId = 1;

    if (scanComplete && quizCount >= 5) levelId = 2;
    if (levelId >= 2 && allCategoriesAbove50) levelId = 3;
    if (levelId >= 3 && overallScore >= 75) levelId = 4;
    if (levelId >= 4 && overallScore >= 90) levelId = 5;
    if (levelId >= 5 && overallScore >= 100) levelId = 6;

    const currentLevel = PREP_LEVELS[levelId - 1];
    const nextLevel = levelId < 6 ? PREP_LEVELS[levelId] : null;

    // Calculate progress to next level
    let progressToNext = 0;
    const missingRequirements: string[] = [];

    if (nextLevel) {
      switch (nextLevel.id) {
        case 2:
          progressToNext = Math.min(100, ((scanComplete ? 50 : 0) + Math.min(50, (quizCount / 5) * 50)));
          if (!scanComplete) missingRequirements.push('Complete the Readiness Scan');
          if (quizCount < 5) missingRequirements.push(`Complete ${5 - quizCount} more quizzes`);
          break;
        case 3:
          progressToNext = allCategoriesAbove50 ? 100 : Math.round(overallScore * 0.8);
          if (!allCategoriesAbove50) missingRequirements.push('Reach 50%+ in all scan categories');
          break;
        case 4:
          progressToNext = Math.min(100, Math.round((overallScore / 75) * 100));
          if (overallScore < 75) missingRequirements.push(`Reach 75% overall readiness (currently ${overallScore}%)`);
          break;
        case 5:
          progressToNext = Math.min(100, Math.round((overallScore / 90) * 100));
          if (overallScore < 90) missingRequirements.push(`Reach 90% overall readiness (currently ${overallScore}%)`);
          break;
        case 6:
          progressToNext = overallScore;
          if (overallScore < 100) missingRequirements.push('Complete all readiness scan items');
          break;
      }
    } else {
      progressToNext = 100;
    }

    return { currentLevel, nextLevel, progressToNext, missingRequirements };
  } catch {
    return {
      currentLevel: PREP_LEVELS[0],
      nextLevel: PREP_LEVELS[1],
      progressToNext: 0,
      missingRequirements: ['Complete the Readiness Scan to get started'],
    };
  }
}
