import { initialLearningData } from '@/src/data/initialLearningData';
import type { LearningState } from '@/src/domain/learning';

const STORAGE_KEY = 'tempo-learning-v1';

export const initialLearningState: LearningState = {
  data: initialLearningData,
  progress: {
    masteryByCard: {},
    reviewedCount: 0,
    revisionSeconds: 0,
  },
};

function migrateLearningState(state: LearningState): LearningState {
  const catalogIds = new Set(
    initialLearningData.subjects.map((subject) => subject.id),
  );
  const customSubjects = state.data.subjects.filter(
    (subject) => !catalogIds.has(subject.id) && !subject.demo,
  );
  const courses = state.data.courses.filter((course) => !course.demo);
  const courseIds = new Set(courses.map((course) => course.id));
  const flashcards = state.data.flashcards.filter((card) =>
    courseIds.has(card.courseId),
  );
  const flashcardIds = new Set(flashcards.map((card) => card.id));
  const masteryByCard = Object.fromEntries(
    Object.entries(state.progress.masteryByCard).filter(([cardId]) =>
      flashcardIds.has(cardId),
    ),
  );

  return {
    data: {
      version: initialLearningData.version,
      subjects: [...initialLearningData.subjects, ...customSubjects],
      courses,
      flashcards,
      quizQuestions: state.data.quizQuestions.filter((question) =>
        courseIds.has(question.courseId),
      ),
    },
    progress: { ...state.progress, masteryByCard },
  };
}

export function loadLearningState(): LearningState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialLearningState;
    const parsed = JSON.parse(stored) as Partial<LearningState>;
    if (!parsed.data || !parsed.progress) return initialLearningState;
    return migrateLearningState(parsed as LearningState);
  } catch {
    return initialLearningState;
  }
}

export function saveLearningState(state: LearningState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
