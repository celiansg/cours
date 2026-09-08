import { demoLearningData } from '@/src/data/demoLearningData';
import type { LearningState } from '@/src/domain/learning';

const STORAGE_KEY = 'tempo-learning-v1';

export const initialLearningState: LearningState = {
  data: demoLearningData,
  progress: {
    masteryByCard: {
      'f-paper-1': 'mastered',
      'f-paper-2': 'medium',
      'f-paper-3': 'review',
      'f-digital-1': 'mastered',
      'f-percent-1': 'medium',
      'f-optics-1': 'review',
    },
    reviewedCount: 6,
    revisionSeconds: 8 * 60,
  },
};

export function loadLearningState(): LearningState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialLearningState;
    const parsed = JSON.parse(stored) as Partial<LearningState>;
    if (!parsed.data || parsed.data.version !== demoLearningData.version || !parsed.progress) return initialLearningState;
    return parsed as LearningState;
  } catch {
    return initialLearningState;
  }
}

export function saveLearningState(state: LearningState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
