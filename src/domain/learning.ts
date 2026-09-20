export type CourseBlock =
  | { id: string; type: 'text'; title?: string; content: string }
  | { id: string; type: 'important'; title: string; content: string }
  | { id: string; type: 'definition'; term: string; definition: string }
  | { id: string; type: 'formula'; formula: string; explanation?: string }
  | { id: string; type: 'method'; title: string; steps: string[] }
  | { id: string; type: 'example'; title: string; content: string }
  | { id: string; type: 'warning'; title: string; content: string };

export type MasteryStatus = 'new' | 'review' | 'medium' | 'mastered';
export type FlashcardDifficulty = 'easy' | 'medium' | 'hard';

export interface Subject {
  id: string;
  name: string;
  icon: 'layers' | 'calculator' | 'flask' | 'language' | 'book';
  accent: string;
  description?: string;
  demo?: boolean;
}

export interface LearningCourse {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  blocks: CourseBlock[];
  demo?: boolean;
}

export interface CoursePhotoAnalysis {
  title: string;
  description: string;
  summary: string;
  keyPoints: string[];
  definitions: { term: string; definition: string }[];
  formulas: { formula: string; explanation: string }[];
  methods: { title: string; steps: string[] }[];
  examples: { title: string; content: string }[];
  warnings: { title: string; content: string }[];
  flashcards: {
    question: string;
    answer: string;
    difficulty: FlashcardDifficulty;
  }[];
}

export interface Flashcard {
  id: string;
  subjectId: string;
  courseId: string;
  question: string;
  answer: string;
  difficulty?: FlashcardDifficulty;
}

export interface QuizQuestion {
  id: string;
  subjectId: string;
  courseId: string;
  question: string;
  choices: string[];
  correctChoiceIndex: number;
  explanation?: string;
}

export interface RevisionProgress {
  masteryByCard: Record<string, MasteryStatus>;
  reviewedCount: number;
  revisionSeconds: number;
  lastReviewedAt?: string;
}

export interface LearningData {
  version: number;
  subjects: Subject[];
  courses: LearningCourse[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

export interface LearningState {
  data: LearningData;
  progress: RevisionProgress;
}
