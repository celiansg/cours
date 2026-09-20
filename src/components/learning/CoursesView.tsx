import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calculator,
  Camera,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Images,
  Languages,
  Layers3,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Sigma,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type {
  CourseBlock,
  CoursePhotoAnalysis,
  LearningCourse,
  LearningData,
  RevisionProgress,
  Subject,
} from '@/src/domain/learning';
import {
  cardsForCourse,
  cardsForSubject,
  coursesForSubject,
  summarizeMastery,
} from '@/src/lib/mastery';
import { analyzeCourseImage } from '@/src/services/courseAnalysis';

const iconMap = {
  layers: Layers3,
  calculator: Calculator,
  flask: FlaskConical,
  language: Languages,
  book: BookOpen,
};

function CourseBlockCard({ block }: { block: CourseBlock }) {
  if (block.type === 'text')
    return (
      <section className="lesson-block lesson-text">
        <div className="lesson-block-icon">
          <BookOpen />
        </div>
        <div>
          {block.title ? <h3>{block.title}</h3> : null}
          <p>{block.content}</p>
        </div>
      </section>
    );
  if (block.type === 'important')
    return (
      <section className="lesson-block lesson-important">
        <div className="lesson-block-icon">
          <Sparkles />
        </div>
        <div>
          <span>À retenir</span>
          <h3>{block.title}</h3>
          <p>{block.content}</p>
        </div>
      </section>
    );
  if (block.type === 'definition')
    return (
      <section className="lesson-block lesson-definition">
        <div className="lesson-block-icon">
          <Lightbulb />
        </div>
        <div>
          <span>Définition</span>
          <h3>{block.term}</h3>
          <p>{block.definition}</p>
        </div>
      </section>
    );
  if (block.type === 'formula')
    return (
      <section className="lesson-block lesson-formula">
        <div className="lesson-block-icon">
          <Sigma />
        </div>
        <div>
          <span>Formule</span>
          <strong>{block.formula}</strong>
          {block.explanation ? <p>{block.explanation}</p> : null}
        </div>
      </section>
    );
  if (block.type === 'method')
    return (
      <section className="lesson-block lesson-method">
        <div className="lesson-block-icon">
          <ListChecks />
        </div>
        <div>
          <span>Méthode</span>
          <h3>{block.title}</h3>
          <ol>
            {block.steps.map((step, index) => (
              <li key={step}>
                <b>{index + 1}</b>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  if (block.type === 'example')
    return (
      <section className="lesson-block lesson-example">
        <div className="lesson-block-icon">
          <Lightbulb />
        </div>
        <div>
          <span>Exemple</span>
          <h3>{block.title}</h3>
          <p>{block.content}</p>
        </div>
      </section>
    );
  return (
    <section className="lesson-block lesson-warning">
      <div className="lesson-block-icon">
        <AlertTriangle />
      </div>
      <div>
        <span>Attention</span>
        <h3>{block.title}</h3>
        <p>{block.content}</p>
      </div>
    </section>
  );
}

function SubjectCard({
  subject,
  data,
  progress,
  onOpen,
}: {
  subject: Subject;
  data: LearningData;
  progress: RevisionProgress;
  onOpen: () => void;
}) {
  const Icon = iconMap[subject.icon];
  const courses = coursesForSubject(subject.id, data.courses);
  const cards = cardsForSubject(subject.id, data.flashcards);
  const mastery = summarizeMastery(cards, progress);
  return (
    <button
      className="subject-card"
      style={{ '--subject-accent': subject.accent } as CSSProperties}
      onClick={onOpen}
    >
      <div className="subject-card-top">
        <span className="subject-icon">
          <Icon />
        </span>
        {subject.demo ? <span className="demo-pill">Démo</span> : null}
      </div>
      <h2>{subject.name}</h2>
      <p>{subject.description}</p>
      <div className="subject-counts">
        <span>{courses.length} cours</span>
        <i /> <span>{cards.length} cartes</span>
      </div>
      <div className="subject-progress-row">
        <strong>{mastery.percentage} % maîtrisé</strong>
        <ChevronRight />
      </div>
      <Progress value={mastery.percentage} className="mastery-progress" />
    </button>
  );
}

function blocksFromAnalysis(analysis: CoursePhotoAnalysis): CourseBlock[] {
  const id = () => crypto.randomUUID();
  return [
    {
      id: id(),
      type: 'text' as const,
      title: 'Résumé du cours',
      content: analysis.summary,
    },
    ...(analysis.keyPoints.length
      ? [
          {
            id: id(),
            type: 'important' as const,
            title: 'L’essentiel à retenir',
            content: analysis.keyPoints.join(' • '),
          },
        ]
      : []),
    ...analysis.definitions.map((item) => ({
      id: id(),
      type: 'definition' as const,
      ...item,
    })),
    ...analysis.formulas.map((item) => ({
      id: id(),
      type: 'formula' as const,
      ...item,
    })),
    ...analysis.methods.map((item) => ({
      id: id(),
      type: 'method' as const,
      ...item,
    })),
    ...analysis.examples.map((item) => ({
      id: id(),
      type: 'example' as const,
      ...item,
    })),
    ...analysis.warnings.map((item) => ({
      id: id(),
      type: 'warning' as const,
      ...item,
    })),
  ];
}

function CourseImportModal({
  data,
  initialSubjectId,
  onClose,
  onDataChange,
  onImported,
}: {
  data: LearningData;
  initialSubjectId?: string;
  onClose: () => void;
  onDataChange: (data: LearningData) => void;
  onImported: (subjectId: string, courseId: string) => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ''),
    [file],
  );
  const [subjectId, setSubjectId] = useState(
    initialSubjectId ?? data.subjects[0]?.id ?? 'new',
  );
  const [newSubjectName, setNewSubjectName] = useState('');
  const [titleHint, setTitleHint] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith('image/')) {
      setError('Choisis une photo JPEG, PNG ou WebP.');
      return;
    }
    setFile(nextFile);
    setError('');
  };

  const importCourse = async () => {
    if (!file) {
      setError('Ajoute d’abord une photo de ton cours.');
      return;
    }
    const existingSubject = data.subjects.find((item) => item.id === subjectId);
    const subjectName =
      subjectId === 'new' ? newSubjectName.trim() : existingSubject?.name;
    if (!subjectName) {
      setError('Choisis une matière ou indique son nom.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const analysis = await analyzeCourseImage(file, {
        subjectName,
        titleHint: titleHint.trim() || undefined,
      });
      const finalSubjectId = existingSubject?.id ?? crypto.randomUUID();
      const courseId = crypto.randomUUID();
      const subjects = existingSubject
        ? data.subjects
        : [
            ...data.subjects,
            {
              id: finalSubjectId,
              name: subjectName,
              icon: 'book' as const,
              accent: '#ed6f9f',
              description: 'Cours importés et structurés avec l’IA',
            },
          ];
      const course: LearningCourse = {
        id: courseId,
        subjectId: finalSubjectId,
        title: analysis.title,
        description: analysis.description,
        blocks: blocksFromAnalysis(analysis),
      };
      const flashcards = analysis.flashcards.map((card) => ({
        ...card,
        id: crypto.randomUUID(),
        subjectId: finalSubjectId,
        courseId,
      }));
      onDataChange({
        ...data,
        subjects,
        courses: [...data.courses, course],
        flashcards: [...data.flashcards, ...flashcards],
      });
      onImported(finalSubjectId, courseId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Impossible d’analyser cette photo.',
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div
      className="course-import-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !analyzing) onClose();
      }}
    >
      <dialog
        open
        className="course-import-modal"
        aria-labelledby="course-import-title"
      >
        <header>
          <div>
            <span className="import-orb">
              <WandSparkles />
            </span>
            <div>
              <p className="eyebrow">Cours intelligent</p>
              <h2 id="course-import-title">Transformer une photo en fiche</h2>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={analyzing}
            aria-label="Fermer"
          >
            <X />
          </button>
        </header>
        <p className="import-intro">
          Prends une photo nette ou choisis-la dans ta galerie. Tempo crée le
          résumé et les cartes de révision automatiquement.
        </p>
        <div className="photo-actions">
          <button onClick={() => cameraInput.current?.click()}>
            <Camera />
            <span>
              <strong>Prendre une photo</strong>
              <small>Ouvrir l’appareil photo</small>
            </span>
          </button>
          <button onClick={() => galleryInput.current?.click()}>
            <Images />
            <span>
              <strong>Choisir dans la galerie</strong>
              <small>JPEG, PNG ou WebP</small>
            </span>
          </button>
        </div>
        <input
          ref={cameraInput}
          className="visually-hidden-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <input
          ref={galleryInput}
          className="visually-hidden-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        {previewUrl ? (
          <div className="course-photo-preview">
            {/* oxlint-disable-next-line next/no-img-element */}
            <img src={previewUrl} alt="Aperçu du cours sélectionné" />
            <div>
              <Sparkles aria-hidden="true" />
              <strong>{file?.name}</strong>
              <span>Photo prête à être analysée</span>
            </div>
          </div>
        ) : (
          <div className="course-photo-placeholder">
            <Images />
            <span>Ta photo apparaîtra ici</span>
          </div>
        )}
        <div className="import-fields">
          <div>
            <label htmlFor="course-import-subject">Matière</label>
            <select
              id="course-import-subject"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              {data.subjects.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
              <option value="new">Nouvelle matière…</option>
            </select>
          </div>
          {subjectId === 'new' ? (
            <div>
              <label htmlFor="course-import-new-subject">
                Nom de la matière
              </label>
              <Input
                id="course-import-new-subject"
                value={newSubjectName}
                onChange={(event) => setNewSubjectName(event.target.value)}
                placeholder="Ex. Communication graphique"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="course-import-title-hint">
              Titre du cours <span>(facultatif)</span>
            </label>
            <Input
              id="course-import-title-hint"
              value={titleHint}
              onChange={(event) => setTitleHint(event.target.value)}
              placeholder="L’IA peut aussi le détecter"
            />
          </div>
        </div>
        {error ? (
          <div className="import-error">
            <CircleAlert />
            {error}
          </div>
        ) : null}
        <div className="privacy-note">
          <ShieldCheck />
          <span>
            La clé API reste sur le serveur. La photo sert uniquement à créer ta
            fiche.
          </span>
        </div>
        <button
          className="analyze-course-button"
          onClick={importCourse}
          disabled={analyzing || !file}
        >
          {analyzing ? (
            <>
              <LoaderCircle className="spinning" /> Analyse du cours…
            </>
          ) : (
            <>
              <Sparkles /> Créer le résumé et les cartes
            </>
          )}
        </button>
      </dialog>
    </div>
  );
}

interface CoursesViewProps {
  data: LearningData;
  progress: RevisionProgress;
  onDataChange: (data: LearningData) => void;
  onStartRevision: (courseIds: string[]) => void;
  onOpenSettings: () => void;
}

export function CoursesView({
  data,
  progress,
  onDataChange,
  onStartRevision,
  onOpenSettings,
}: CoursesViewProps) {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const subject = data.subjects.find((item) => item.id === subjectId);
  const course = data.courses.find((item) => item.id === courseId);
  const subjectCourses = useMemo(
    () =>
      subject
        ? coursesForSubject(subject.id, data.courses).filter((item) =>
            item.title
              .toLocaleLowerCase('fr-FR')
              .includes(deferredQuery.toLocaleLowerCase('fr-FR')),
          )
        : [],
    [data.courses, deferredQuery, subject],
  );

  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    const next: Subject = {
      id: crypto.randomUUID(),
      name,
      icon: 'book',
      accent: '#ec6f91',
    };
    onDataChange({ ...data, subjects: [...data.subjects, next] });
    setNewSubjectName('');
    setShowSubjectForm(false);
  };
  const addCourse = () => {
    const title = newCourseName.trim();
    if (!title || !subject) return;
    const next: LearningCourse = {
      id: crypto.randomUUID(),
      subjectId: subject.id,
      title,
      blocks: [],
    };
    onDataChange({ ...data, courses: [...data.courses, next] });
    setNewCourseName('');
    setShowCourseForm(false);
  };
  const importModal = showImport ? (
    <CourseImportModal
      data={data}
      initialSubjectId={subject?.id}
      onClose={() => setShowImport(false)}
      onDataChange={onDataChange}
      onImported={(nextSubjectId, nextCourseId) => {
        setSubjectId(nextSubjectId);
        setCourseId(nextCourseId);
        setShowImport(false);
      }}
    />
  ) : null;

  if (course && subject) {
    const cards = cardsForCourse(course.id, data.flashcards);
    const mastery = summarizeMastery(cards, progress);
    return (
      <>
        <section className="learning-screen">
          <header className="learning-detail-header">
            <button className="back-button" onClick={() => setCourseId(null)}>
              <ArrowLeft /> <span>{subject.name}</span>
            </button>
            <button className="avatar small-avatar" onClick={onOpenSettings}>
              CS
            </button>
          </header>
          <div
            className="lesson-hero"
            style={{ '--subject-accent': subject.accent } as CSSProperties}
          >
            <div>
              <span className="demo-pill">
                {course.demo
                  ? 'Contenu de démonstration'
                  : 'Créé depuis ta photo'}
              </span>
              <p>{subject.name}</p>
              <h1>{course.title}</h1>
              <span>{course.description ?? 'Fiche de cours structurée'}</span>
            </div>
            <div className="lesson-score">
              <strong>{mastery.percentage}%</strong>
              <span>maîtrisé</span>
            </div>
          </div>
          <div className="lesson-actions">
            <div>
              <BookOpen />
              <span>{course.blocks.length} blocs de contenu</span>
            </div>
            <div>
              <Sparkles />
              <span>{cards.length} flashcards</span>
            </div>
            <button onClick={() => onStartRevision([course.id])}>
              Réviser ce cours <ChevronRight />
            </button>
          </div>
          <div className="lesson-content">
            {course.blocks.length ? (
              course.blocks.map((block) => (
                <CourseBlockCard block={block} key={block.id} />
              ))
            ) : (
              <div className="learning-empty">
                <CircleAlert />
                <h3>Cours vide</h3>
                <p>Le contenu réel pourra être ajouté ici plus tard.</p>
              </div>
            )}
          </div>
        </section>
        {importModal}
      </>
    );
  }

  if (subject) {
    const cards = cardsForSubject(subject.id, data.flashcards);
    const mastery = summarizeMastery(cards, progress);
    const Icon = iconMap[subject.icon];
    return (
      <>
        <section className="learning-screen">
          <header className="learning-detail-header">
            <button
              className="back-button"
              onClick={() => {
                setSubjectId(null);
                setQuery('');
              }}
            >
              <ArrowLeft /> <span>Toutes les matières</span>
            </button>
            <div className="header-actions">
              <button
                className="course-import-compact"
                onClick={() => setShowImport(true)}
              >
                <Plus /> <span>Importer</span>
              </button>
              <button className="avatar small-avatar" onClick={onOpenSettings}>
                CS
              </button>
            </div>
          </header>
          <div
            className="subject-detail-hero"
            style={{ '--subject-accent': subject.accent } as CSSProperties}
          >
            <span className="subject-icon large">
              <Icon />
            </span>
            <div>
              <span className="demo-pill">
                {subject.demo ? 'Démonstration' : 'Matière'}
              </span>
              <h1>{subject.name}</h1>
              <p>
                {cards.length} cartes · {mastery.percentage} % maîtrisé
              </p>
            </div>
            <Progress
              value={mastery.percentage}
              className="mastery-progress hero-mastery"
            />
          </div>
          <div className="course-tools">
            <div className="course-search">
              <Search />
              <Input
                aria-label="Rechercher un cours"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un cours"
              />
            </div>
            <button
              className="color-action"
              onClick={() => setShowCourseForm((value) => !value)}
            >
              <Plus /> Ajouter un cours
            </button>
          </div>
          {showCourseForm ? (
            <div className="inline-create">
              <Input
                value={newCourseName}
                onChange={(event) => setNewCourseName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addCourse();
                }}
                placeholder="Nom du nouveau cours"
              />
              <button onClick={addCourse}>Ajouter</button>
            </div>
          ) : null}
          <div className="course-list">
            {subjectCourses.map((item) => {
              const courseCards = cardsForCourse(item.id, data.flashcards);
              const summary = summarizeMastery(courseCards, progress);
              return (
                <button key={item.id} onClick={() => setCourseId(item.id)}>
                  <span className="course-list-icon">
                    <BookOpen />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {courseCards.length} cartes ·{' '}
                      {courseCards.length
                        ? `${summary.percentage} % maîtrisé`
                        : 'Non révisé'}
                    </p>
                    <Progress
                      value={summary.percentage}
                      className="mastery-progress small-progress"
                    />
                  </div>
                  <ChevronRight />
                </button>
              );
            })}
          </div>
        </section>
        {importModal}
      </>
    );
  }

  return (
    <>
      <section className="learning-screen">
        <header className="section-header learning-main-header">
          <div>
            <p className="eyebrow">Bibliothèque</p>
            <h1>Mes cours</h1>
            <p className="header-subtitle">
              Tes matières, chapitres et fiches de révision au même endroit.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="course-import-trigger"
              onClick={() => setShowImport(true)}
              aria-label="Importer une photo de cours"
            >
              <Plus />
              <span>Importer un cours</span>
            </button>
            <button className="avatar" onClick={onOpenSettings}>
              CS
            </button>
          </div>
        </header>
        <div className="demo-notice">
          <Sparkles />
          <div>
            <strong>Données de démonstration</strong>
            <span>
              Quelques exemples seulement, en attendant tes vrais cours.
            </span>
          </div>
        </div>
        <div className="subjects-grid">
          {data.subjects.map((item) => (
            <SubjectCard
              key={item.id}
              subject={item}
              data={data}
              progress={progress}
              onOpen={() => setSubjectId(item.id)}
            />
          ))}
          <button
            className="add-subject-card"
            onClick={() => setShowSubjectForm((value) => !value)}
          >
            <Plus />
            <strong>Ajouter une matière</strong>
            <span>Créer un nouvel espace de cours</span>
          </button>
        </div>
        {showSubjectForm ? (
          <div className="inline-create subject-create">
            <Input
              value={newSubjectName}
              onChange={(event) => setNewSubjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addSubject();
              }}
              placeholder="Nom de la matière"
            />
            <button onClick={addSubject}>Créer la matière</button>
          </div>
        ) : null}
      </section>
      {importModal}
    </>
  );
}
