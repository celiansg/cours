import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BrainCircuit, Check, ChevronRight, Flame, RotateCcw,
  Sparkles, Target, TimerReset,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import type { LearningData, MasteryStatus, RevisionProgress } from '@/src/domain/learning';
import { cardsForCourse, coursesForSubject, summarizeMastery } from '@/src/lib/mastery';

interface RevisionViewProps {
  data: LearningData;
  progress: RevisionProgress;
  requestedCourseIds: string[];
  onProgressChange: (progress: RevisionProgress) => void;
  onOpenSettings: () => void;
}

const ratingOptions: { label: string; status: MasteryStatus; className: string }[] = [
  { label: 'À revoir', status: 'review', className: 'review' },
  { label: 'Moyen', status: 'medium', className: 'medium' },
  { label: 'Je savais', status: 'mastered', className: 'mastered' },
];

export function RevisionView({ data, progress, requestedCourseIds, onProgressChange, onOpenSettings }: RevisionViewProps) {
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() => requestedCourseIds);
  const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [complete, setComplete] = useState(false);
  const cardShownAt = useRef(0);

  const sessionCards = useMemo(() => {
    const byId = new Map(data.flashcards.map(card => [card.id, card]));
    return sessionCardIds.flatMap(id => byId.get(id) ?? []);
  }, [data.flashcards, sessionCardIds]);
  const currentCard = sessionCards[index];
  const overall = summarizeMastery(data.flashcards, progress);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(current => current.includes(courseId) ? current.filter(id => id !== courseId) : [...current, courseId]);
  };
  const toggleSubject = (courseIds: string[]) => {
    setSelectedCourseIds(current => {
      const allSelected = courseIds.every(id => current.includes(id));
      if (allSelected) return current.filter(id => !courseIds.includes(id));
      return [...new Set([...current, ...courseIds])];
    });
  };
  const startSession = (difficultOnly: boolean, startedAt: number) => {
    const selected = new Set(selectedCourseIds);
    const cards = data.flashcards.filter(card => (selected.size === 0 || selected.has(card.courseId)) && (!difficultOnly || progress.masteryByCard[card.id] === 'review'));
    setSessionCardIds(cards.map(card => card.id));
    setIndex(0);
    setFlipped(false);
    setComplete(cards.length === 0);
    cardShownAt.current = startedAt;
  };
  const rateCard = (status: MasteryStatus, ratedAt: number) => {
    if (!currentCard) return;
    const elapsed = Math.max(1, Math.min(300, Math.round((ratedAt - cardShownAt.current) / 1000)));
    onProgressChange({
      ...progress,
      masteryByCard: { ...progress.masteryByCard, [currentCard.id]: status },
      reviewedCount: progress.reviewedCount + 1,
      revisionSeconds: progress.revisionSeconds + elapsed,
      lastReviewedAt: new Date().toISOString(),
    });
    if (index + 1 >= sessionCards.length) setComplete(true);
    else { setIndex(value => value + 1); setFlipped(false); cardShownAt.current = ratedAt; }
  };
  const resetSession = () => { setSessionCardIds([]); setComplete(false); setIndex(0); setFlipped(false); };

  if (sessionCards.length && !complete && currentCard) {
    const course = data.courses.find(item => item.id === currentCard.courseId);
    const subject = data.subjects.find(item => item.id === currentCard.subjectId);
    const percentage = Math.round(index / sessionCards.length * 100);
    return <section className="revision-screen active-session">
      <header className="learning-detail-header"><button className="back-button" onClick={resetSession}><ArrowLeft /> <span>Quitter la session</span></button><div className="session-counter">{index + 1} / {sessionCards.length}</div></header>
      <div className="session-progress"><div><span>{subject?.name}</span><strong>{course?.title}</strong></div><span>{percentage} %</span></div><Progress value={percentage} className="revision-progress" />
      <div className="flashcard-stage"><button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(value => !value)} aria-label={flipped ? 'Voir la question' : 'Voir la réponse'}>
        <span className="flashcard-kicker">{flipped ? 'Réponse' : 'Question'}</span><strong>{flipped ? currentCard.answer : currentCard.question}</strong><span className="flip-hint"><RotateCcw /> Cliquer pour retourner</span>
      </button></div>
      {flipped ? <div className="rating-panel"><p>Tu connaissais la réponse ?</p><div>{ratingOptions.map(option => <button className={option.className} key={option.status} onClick={event => rateCard(option.status, event.timeStamp)}>{option.status === 'review' ? <RotateCcw /> : option.status === 'medium' ? <Target /> : <Check />}<span>{option.label}</span></button>)}</div></div> : <button className="reveal-button" onClick={() => setFlipped(true)}>Afficher la réponse <ChevronRight /></button>}
    </section>;
  }

  if (complete) {
    return <section className="revision-screen revision-complete"><div className="complete-orb"><Sparkles /></div><p className="eyebrow">Session terminée</p><h1>{sessionCards.length ? 'Bien joué !' : 'Aucune carte à réviser'}</h1><p>{sessionCards.length ? `${sessionCards.length} flashcards parcourues. Tes résultats sont enregistrés sur cet appareil.` : 'Sélectionne d’autres cours, ou révise les cartes difficiles après en avoir marqué “À revoir”.'}</p><button onClick={resetSession}>Choisir une autre session</button></section>;
  }

  return <section className="revision-screen"><header className="section-header revision-header"><div><p className="eyebrow">Mémorisation active</p><h1>Réviser</h1><p className="header-subtitle">Choisis tes cours, puis avance carte après carte.</p></div><button className="avatar" onClick={onOpenSettings}>CS</button></header>
    <div className="revision-overview"><div className="revision-orb"><BrainCircuit /></div><div><span>Maîtrise globale</span><strong>{overall.percentage} %</strong><p>{overall.mastered} acquises · {overall.review} à revoir</p></div><Progress value={overall.percentage} className="revision-overview-progress" /></div>
    <div className="revision-toolbar"><div><h2>Composer une session</h2><p>Aucune sélection = toutes les cartes.</p></div><button onClick={event => startSession(true, event.timeStamp)}><Flame /> Revoir mes difficultés</button></div>
    <div className="revision-subjects">{data.subjects.map(subject => { const subjectCourses = coursesForSubject(subject.id, data.courses); const subjectCourseIds = subjectCourses.map(course => course.id); const allSelected = subjectCourseIds.every(id => selectedCourseIds.includes(id)); return <section key={subject.id}><div className="revision-subject-title"><span style={{ background: subject.accent }} /><div><h3>{subject.name}</h3><p>{subjectCourses.reduce((sum, course) => sum + cardsForCourse(course.id, data.flashcards).length, 0)} cartes</p></div><button type="button" onClick={() => toggleSubject(subjectCourseIds)}>{allSelected ? 'Retirer' : 'Tout choisir'}</button></div><div>{subjectCourses.map(course => { const cards = cardsForCourse(course.id, data.flashcards); const checked = selectedCourseIds.includes(course.id); return <button type="button" className={`course-choice ${checked ? 'selected' : ''}`} key={course.id} onClick={() => toggleCourse(course.id)}><Checkbox checked={checked} onClick={event => event.stopPropagation()} onCheckedChange={() => toggleCourse(course.id)} /><span><strong>{course.title}</strong><small>{cards.length} flashcards</small></span><ChevronRight /></button>; })}</div></section>; })}</div>
    <button className="start-revision" onClick={event => startSession(false, event.timeStamp)}><TimerReset /><span><strong>Lancer la révision</strong><small>{selectedCourseIds.length ? `${selectedCourseIds.length} cours sélectionné${selectedCourseIds.length > 1 ? 's' : ''}` : `${data.flashcards.length} cartes disponibles`}</small></span><ChevronRight /></button>
  </section>;
}
