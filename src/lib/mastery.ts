import type { Flashcard, LearningCourse, MasteryStatus, RevisionProgress } from '@/src/domain/learning';

const masteryScore: Record<MasteryStatus, number> = { new: 0, review: 0.15, medium: 0.55, mastered: 1 };

export interface MasterySummary {
  percentage: number;
  total: number;
  mastered: number;
  review: number;
  medium: number;
  fresh: number;
}

export function summarizeMastery(cards: Flashcard[], progress: RevisionProgress): MasterySummary {
  if (!cards.length) return { percentage: 0, total: 0, mastered: 0, review: 0, medium: 0, fresh: 0 };
  let score = 0; let mastered = 0; let review = 0; let medium = 0; let fresh = 0;
  for (const card of cards) {
    const status = progress.masteryByCard[card.id] ?? 'new'; score += masteryScore[status];
    if (status === 'mastered') mastered += 1; else if (status === 'review') review += 1; else if (status === 'medium') medium += 1; else fresh += 1;
  }
  return { percentage: Math.round(score / cards.length * 100), total: cards.length, mastered, review, medium, fresh };
}

export function cardsForCourse(courseId: string, cards: Flashcard[]) { return cards.filter(card => card.courseId === courseId); }
export function cardsForSubject(subjectId: string, cards: Flashcard[]) { return cards.filter(card => card.subjectId === subjectId); }
export function coursesForSubject(subjectId: string, courses: LearningCourse[]) { return courses.filter(course => course.subjectId === subjectId); }
