export type QuizFormat = 'multiple_choice' | 'priority_order' | 'decision_tree';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface MCOption { id: string; text: string; }
export interface MultipleChoiceQuiz {
  id: string; category: string; type: 'multiple_choice';
  difficulty: QuizDifficulty; scenario: string;
  options: MCOption[]; correct: string; explanation: string;
  relatedGuide?: string; tags: string[];
}

export interface POItem { id: string; text: string; }
export interface PriorityOrderQuiz {
  id: string; category: string; type: 'priority_order';
  difficulty: QuizDifficulty; scenario: string;
  items: POItem[]; correct_order: string[]; explanation: string;
  relatedGuide?: string; tags: string[];
}

export interface DTOption { text: string; next: string; }
export interface DTNode {
  id: string; scenario?: string;
  options?: DTOption[];
  outcome?: 'success' | 'poor';
  explanation?: string;
}
export interface DecisionTreeQuiz {
  id: string; category: string; type: 'decision_tree';
  difficulty: QuizDifficulty; title: string;
  nodes: Record<string, DTNode>;
  relatedGuide?: string; tags: string[];
}

export type Quiz = MultipleChoiceQuiz | PriorityOrderQuiz | DecisionTreeQuiz;
