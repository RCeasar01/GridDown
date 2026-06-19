import { getAllQuizzes } from './quizRegistry';

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash * 31) + dateStr.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

export function getDrillInfo(): {
  quizId: string;
  category: string;
  difficulty: string;
  format: string;
  title: string;
} {
  const today = new Date().toISOString().split('T')[0];
  const quizzes = getAllQuizzes();
  if (quizzes.length === 0) {
    return { quizId: '', category: '', difficulty: '', format: '', title: '' };
  }
  const idx = hashDate(today) % quizzes.length;
  const quiz = quizzes[idx];
  const title =
    quiz.type === 'decision_tree'
      ? (quiz as any).title
      : ((quiz as any).scenario ? (quiz as any).scenario.slice(0, 70) + '...' : quiz.id);
  return {
    quizId: quiz.id,
    category: quiz.category,
    difficulty: quiz.difficulty,
    format: quiz.type,
    title,
  };
}

export function selectDailyDrillQuiz(): string {
  return getDrillInfo().quizId;
}
