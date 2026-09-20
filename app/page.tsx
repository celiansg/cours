'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Coins,
  Download,
  Edit3,
  Home,
  MapPin,
  Plus,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CoursesView } from '@/src/components/learning/CoursesView';
import { RevisionView } from '@/src/components/learning/RevisionView';
import type {
  LearningData,
  LearningState,
  RevisionProgress,
} from '@/src/domain/learning';
import { cardsForSubject, summarizeMastery } from '@/src/lib/mastery';
import {
  loadLearningState,
  saveLearningState,
} from '@/src/services/learningStorage';

type Tab = 'home' | 'planning' | 'courses' | 'review' | 'stats' | 'settings';
type CourseType = 'course' | 'work' | 'break';
type Course = {
  id: string;
  day: number;
  name: string;
  start: string;
  end: string;
  room: string;
  type: CourseType;
};
type AppSettings = {
  salary: number;
  hoursWeek: number;
  manualRateEnabled: boolean;
  manualRate: number;
  schoolStart: string;
  schoolEnd: string;
  calculationMode: 'calendar' | 'work';
  excludedDates: string[];
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DAY_MS = 86_400_000;
const CALENDAR_VERSION = 'bts-erpc-2e-2026-2027-v1';
const SCHEDULE_VERSION = 'celian-2026-2027-v2';
const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const importedHolidays = [
  '2026-11-11',
  '2027-03-29',
  '2027-05-06',
  '2027-05-07',
  '2027-05-17',
];
const schoolRanges: [string, string][] = [
  ['2026-09-01', '2026-09-04'],
  ['2026-09-07', '2026-09-11'],
  ['2026-10-12', '2026-10-16'],
  ['2026-11-02', '2026-11-06'],
  ['2026-11-09', '2026-11-10'],
  ['2026-11-12', '2026-11-13'],
  ['2026-11-23', '2026-12-04'],
  ['2026-12-14', '2026-12-18'],
  ['2027-01-04', '2027-01-22'],
  ['2027-02-01', '2027-02-12'],
  ['2027-03-01', '2027-03-12'],
  ['2027-03-22', '2027-03-26'],
  ['2027-03-30', '2027-04-09'],
  ['2027-04-26', '2027-05-05'],
];
const defaultSettings: AppSettings = {
  salary: 1200,
  hoursWeek: 35,
  manualRateEnabled: false,
  manualRate: 7.91,
  schoolStart: '2026-09-01',
  schoolEnd: '2027-07-31',
  calculationMode: 'calendar',
  excludedDates: importedHolidays,
};
const defaultCourses: Course[] = [
  {
    id: 'mon-physics',
    day: 1,
    name: 'Physique-chimie',
    start: '08:05',
    end: '10:10',
    room: '323 · TP optique',
    type: 'course',
  },
  {
    id: 'mon-industry',
    day: 1,
    name: 'Industrie graphique',
    start: '13:00',
    end: '15:45',
    room: 'P119 · RPIP Technologie',
    type: 'course',
  },
  {
    id: 'mon-support',
    day: 1,
    name: 'Accompagnement personnalisé',
    start: '15:45',
    end: '16:55',
    room: 'P119 · RPIP Technologie',
    type: 'course',
  },
  {
    id: 'tue-maths',
    day: 2,
    name: 'Mathématiques',
    start: '08:05',
    end: '10:10',
    room: '201 LV',
    type: 'course',
  },
  {
    id: 'tue-complement-1',
    day: 2,
    name: 'Complément 35',
    start: '10:10',
    end: '11:05',
    room: '203 LV',
    type: 'course',
  },
  {
    id: 'tue-complement-2',
    day: 2,
    name: 'Complément 35',
    start: '11:05',
    end: '12:00',
    room: '126',
    type: 'course',
  },
  {
    id: 'tue-science',
    day: 2,
    name: 'Enseignement scientifique en LV',
    start: '13:00',
    end: '13:55',
    room: 'P119 · RPIP Technologie',
    type: 'course',
  },
  {
    id: 'wed-industry-1',
    day: 3,
    name: 'Industrie graphique',
    start: '08:05',
    end: '09:00',
    room: 'P119 · RPIP Technologie',
    type: 'course',
  },
  {
    id: 'wed-industry-2',
    day: 3,
    name: 'Industrie graphique',
    start: '09:00',
    end: '12:00',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
  {
    id: 'wed-industry-3',
    day: 3,
    name: 'Industrie graphique',
    start: '13:55',
    end: '14:50',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
  {
    id: 'wed-support',
    day: 3,
    name: 'Accompagnement personnalisé',
    start: '14:50',
    end: '15:45',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
  {
    id: 'thu-culture',
    day: 4,
    name: 'Culture générale et expression',
    start: '08:05',
    end: '10:10',
    room: '123',
    type: 'course',
  },
  {
    id: 'thu-english',
    day: 4,
    name: 'Anglais LV1',
    start: '10:10',
    end: '12:00',
    room: '133 LV',
    type: 'course',
  },
  {
    id: 'thu-industry-1',
    day: 4,
    name: 'Industrie graphique',
    start: '13:55',
    end: '16:55',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
  {
    id: 'thu-industry-2',
    day: 4,
    name: 'Industrie graphique',
    start: '16:55',
    end: '17:50',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
  {
    id: 'fri-industry-1',
    day: 5,
    name: 'Industrie graphique',
    start: '08:05',
    end: '12:00',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
  {
    id: 'fri-industry-2',
    day: 5,
    name: 'Industrie graphique',
    start: '13:00',
    end: '16:55',
    room: 'P105 · Labo PAO 2',
    type: 'course',
  },
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
function dateFromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function atStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function money(value: number) {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function longDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
function shortDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
function durationLabel(minutes: number) {
  const safe = Math.max(0, Math.ceil(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`;
}

function expandDateRanges(ranges: [string, string][]) {
  const result = new Set<string>();
  for (const [startKey, endKey] of ranges)
    for (
      let date = dateFromKey(startKey);
      date <= dateFromKey(endKey);
      date = addDays(date, 1)
    )
      if (date.getDay() >= 1 && date.getDay() <= 5) result.add(dateKey(date));
  return result;
}

const importedSchoolDays = expandDateRanges(schoolRanges);

function alternanceKind(date: Date): 'school' | 'company' | 'holiday' | 'off' {
  const key = dateKey(date);
  if (date.getDay() === 0 || date.getDay() === 6) return 'off';
  if (importedHolidays.includes(key)) return 'holiday';
  if (importedSchoolDays.has(key)) return 'school';
  if (date >= dateFromKey('2026-09-01') && date <= dateFromKey('2027-07-31'))
    return 'company';
  return 'off';
}

function scheduleForDate(date: Date, courses: Course[]) {
  const kind = alternanceKind(date);
  if (kind === 'holiday' || kind === 'off') return [];
  if (kind === 'company')
    return date.getDay() === 5
      ? [
          {
            id: `company-am-${dateKey(date)}`,
            day: 5,
            name: 'Entreprise',
            start: '08:00',
            end: '12:00',
            room: 'Agence',
            type: 'work' as CourseType,
          },
        ]
      : [
          {
            id: `company-am-${dateKey(date)}`,
            day: date.getDay(),
            name: 'Entreprise',
            start: '08:00',
            end: '12:30',
            room: 'Agence',
            type: 'work' as CourseType,
          },
          {
            id: `company-pm-${dateKey(date)}`,
            day: date.getDay(),
            name: 'Entreprise',
            start: '13:00',
            end: '16:00',
            room: 'Agence',
            type: 'work' as CourseType,
          },
        ];
  return courses.filter((course) => course.day === date.getDay());
}

function nextAlternanceChange(date: Date) {
  const current = alternanceKind(date);
  for (let offset = 1; offset <= 30; offset += 1) {
    const candidate = addDays(date, offset);
    const kind = alternanceKind(candidate);
    if (kind !== 'off' && kind !== 'holiday' && kind !== current)
      return { date: candidate, kind };
  }
  return null;
}

function calculateSchoolProgress(
  now: Date,
  settings: AppSettings,
  courses: Course[],
) {
  const start = dateFromKey(settings.schoolStart);
  const end = dateFromKey(settings.schoolEnd);
  const today = atStart(now);
  const isActiveDay = (date: Date) =>
    settings.calculationMode === 'calendar' ||
    (!settings.excludedDates.includes(dateKey(date)) &&
      ['school', 'company'].includes(alternanceKind(date)) &&
      scheduleForDate(date, courses).some((c) => c.type !== 'break'));
  let total = 0;
  let elapsed = 0;
  const activeDates: Date[] = [];
  for (let d = new Date(start); d < end; d = addDays(d, 1))
    if (isActiveDay(d)) {
      total += 1;
      activeDates.push(new Date(d));
      if (d < today) elapsed += 1;
    }
  const percentage = clamp(total ? (elapsed / total) * 100 : 0);
  const halfwayDate = activeDates[Math.max(0, Math.ceil(total / 2) - 1)] ?? end;
  return {
    start,
    end,
    total,
    elapsed: clamp(elapsed, 0, total),
    remaining: Math.max(0, total - elapsed),
    percentage,
    untilHalf: Math.ceil(
      (atStart(halfwayDate).getTime() - today.getTime()) / DAY_MS,
    ),
  };
}

function earnedForDate(
  date: Date,
  now: Date,
  courses: Course[],
  settings: AppSettings,
  hourly: number,
) {
  if (
    settings.excludedDates.includes(dateKey(date)) ||
    atStart(date) > atStart(now)
  )
    return 0;
  const dayCourses = scheduleForDate(date, courses).filter(
    (c) => c.type !== 'break',
  );
  const isToday = dateKey(date) === dateKey(now);
  const nowMinute =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const minutes = dayCourses.reduce((sum, course) => {
    const start = timeToMinutes(course.start);
    const end = timeToMinutes(course.end);
    return (
      sum + (isToday ? clamp(nowMinute - start, 0, end - start) : end - start)
    );
  }, 0);
  return (minutes / 60) * hourly;
}
function earnedBetween(
  start: Date,
  end: Date,
  now: Date,
  courses: Course[],
  settings: AppSettings,
  hourly: number,
) {
  let total = 0;
  for (let d = atStart(start); d <= atStart(end); d = addDays(d, 1))
    total += earnedForDate(d, now, courses, settings, hourly);
  return total;
}

function YearCard({
  now,
  settings,
  courses,
}: {
  now: Date;
  settings: AppSettings;
  courses: Course[];
}) {
  const school = useMemo(
    () => calculateSchoolProgress(now, settings, courses),
    [now, settings, courses],
  );
  const kind = alternanceKind(now);
  const change = nextAlternanceChange(now);
  return (
    <section className="year-card" aria-labelledby="year-title">
      <div className="year-head">
        <div>
          <p className="eyebrow" id="year-title">
            Année scolaire
          </p>
          <h2>
            {school.start.getFullYear()} — {school.end.getFullYear()}
          </h2>
          <span className="imported-label">
            <Check size={13} /> Calendrier BTS ERPC · 2e année
          </span>
        </div>
        <div className="year-percentage">
          <strong>
            {school.percentage.toLocaleString('fr-FR', {
              maximumFractionDigits: 1,
            })}
          </strong>
          <span>%</span>
        </div>
      </div>
      <div className="year-track-wrap">
        <Progress
          value={school.percentage}
          className="year-progress"
          aria-label={`${school.percentage.toFixed(1)} % de l’année scolaire effectué`}
        />
        {[25, 50, 75, 100].map((mark) => (
          <div
            className={`milestone ${mark === 50 ? 'half' : ''}`}
            style={{ left: `${mark}%` }}
            key={mark}
          >
            <span />
            <small>{mark}%</small>
          </div>
        ))}
      </div>
      <div className="year-summary">
        <p>
          <strong>{school.elapsed} jours</strong> effectués <span>•</span>{' '}
          <strong>{school.remaining} jours</strong> restants
        </p>
        <div className="halfway-note">
          <Sparkles size={15} />
          {school.untilHalf > 0
            ? `50 % atteint dans ${school.untilHalf} jours`
            : 'La moitié de l’année est passée 🎉'}
        </div>
      </div>
      <div className="alternance-status">
        <div>
          <span className={`alternance-dot ${kind}`} />
          <p>Aujourd’hui</p>
          <strong>
            {kind === 'school'
              ? 'Cours au lycée'
              : kind === 'company'
                ? 'En entreprise'
                : kind === 'holiday'
                  ? 'Jour férié / sans cours'
                  : 'Repos'}
          </strong>
        </div>
        {change && (
          <div className="next-change">
            <span>Prochain changement</span>
            <strong>
              {change.kind === 'school' ? 'Cours' : 'Entreprise'} ·{' '}
              {shortDate(change.date)}
            </strong>
          </div>
        )}
      </div>
      <div className="date-scale">
        <div>
          <span>Début</span>
          <strong>{shortDate(school.start)}</strong>
        </div>
        <div className="today-date">
          <span>Aujourd’hui</span>
          <strong>{shortDate(now)}</strong>
        </div>
        <div>
          <span>Fin</span>
          <strong>{shortDate(school.end)}</strong>
        </div>
      </div>
    </section>
  );
}

function HomeScreen({
  now,
  settings,
  courses,
  hourly,
  learning,
  goTo,
}: {
  now: Date;
  settings: AppSettings;
  courses: Course[];
  hourly: number;
  learning: LearningState;
  goTo: (tab: Tab) => void;
}) {
  const todayKind = alternanceKind(now);
  const todayCourses = scheduleForDate(now, courses).sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const minuteNow =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const current = todayCourses.find(
    (c) =>
      minuteNow >= timeToMinutes(c.start) && minuteNow < timeToMinutes(c.end),
  );
  const next = todayCourses.find((c) => timeToMinutes(c.start) > minuteNow);
  const first = todayCourses[0];
  const last = todayCourses[todayCourses.length - 1];
  const progress = current
    ? clamp(
        ((minuteNow - timeToMinutes(current.start)) /
          (timeToMinutes(current.end) - timeToMinutes(current.start))) *
          100,
      )
    : !next && todayCourses.length
      ? 100
      : 0;
  const workedToday = earnedForDate(now, now, courses, settings, hourly);
  const paidMinutesToday = todayCourses
    .filter((course) => course.type !== 'break')
    .reduce(
      (sum, course) =>
        sum +
        clamp(
          minuteNow - timeToMinutes(course.start),
          0,
          timeToMinutes(course.end) - timeToMinutes(course.start),
        ),
      0,
    );
  const earnedCurrent =
    current && current.type !== 'break'
      ? ((minuteNow - timeToMinutes(current.start)) / 60) * hourly
      : 0;
  const dayProgress =
    first && last
      ? clamp(
          ((minuteNow - timeToMinutes(first.start)) /
            (timeToMinutes(last.end) - timeToMinutes(first.start))) *
            100,
        )
      : 0;
  const mastery = summarizeMastery(learning.data.flashcards, learning.progress);
  return (
    <>
      <header className="topbar">
        <div>
          <div className="brand-lockup">
            <span className="brand-logo">
              <img src="/tempo-logo.png" alt="Logo Tempo" />
            </span>
            <span>
              <strong>Tempo</strong>
              <small>Cours & alternance</small>
            </span>
          </div>
          <p className="eyebrow">Aujourd’hui</p>
          <h1>{longDate(now)}</h1>
          <span className={`day-context ${todayKind}`}>
            {todayKind === 'school'
              ? 'Cours · Lycée La Fayette'
              : todayKind === 'company'
                ? 'Entreprise'
                : todayKind === 'holiday'
                  ? 'Jour sans cours'
                  : 'Repos'}
          </span>
        </div>
        <button
          className="avatar"
          onClick={() => goTo('settings')}
          aria-label="Ouvrir le profil"
        >
          CS
        </button>
      </header>
      <section className="hero-grid" aria-label="Vue d’ensemble">
        <article className="glass-card course-card">
          <div className="card-heading">
            <div>
              <span className={`status ${current ? 'live' : ''}`}>
                <span />
                {current
                  ? current.type === 'break'
                    ? 'Pause en cours'
                    : 'En cours'
                  : next
                    ? 'À venir'
                    : todayCourses.length
                      ? 'Terminé'
                      : 'Repos'}
              </span>
              <h2>
                {current?.name ??
                  next?.name ??
                  (todayCourses.length
                    ? 'Journée terminée 🎉'
                    : 'Aucun cours aujourd’hui')}
              </h2>
            </div>
            <div className="course-icon">
              <Sparkles size={21} />
            </div>
          </div>
          {(current || next) && (
            <div className="time-row">
              <span>{(current ?? next)?.start}</span>
              <i />
              <span>{(current ?? next)?.end}</span>
            </div>
          )}
          <div className="course-metric">
            <strong>
              {Math.round(progress)}
              <small>%</small>
            </strong>
            <div>
              <span>
                {current
                  ? `${durationLabel(minuteNow - timeToMinutes(current.start))} écoulées`
                  : next
                    ? `Commence dans ${durationLabel(timeToMinutes(next.start) - minuteNow)}`
                    : '100 % de la journée'}
              </span>
              <b>
                {current
                  ? `${durationLabel(timeToMinutes(current.end) - minuteNow)} restantes`
                  : next
                    ? `Prochain rendez-vous à ${next.start}`
                    : todayCourses.length
                      ? 'Bravo, à demain'
                      : 'Reprise au prochain jour planifié'}
              </b>
            </div>
          </div>
          <Progress value={progress} className="course-progress" />
        </article>
        <article className="glass-card income-card">
          <div className="income-top">
            <div className="income-icon">
              <WalletCards size={22} />
            </div>
            <span className="soft-badge">+{money(hourly / 60)} €/min</span>
          </div>
          <p>Revenus en direct</p>
          <strong>+ {money(earnedCurrent)} €</strong>
          <span>Depuis le début du cours</span>
          <div className="income-footer">
            <div>
              <span>Équivalent aujourd’hui</span>
              <small>
                {durationLabel(paidMinutesToday)} valorisées à {money(hourly)}{' '}
                €/h
              </small>
            </div>
            <b>+ {money(workedToday)} €</b>
          </div>
        </article>
      </section>
      <YearCard now={now} settings={settings} courses={courses} />
      <section className="quick-grid">
        <article className="mini-card">
          <div>
            <Clock3 size={19} />
            <span>Journée</span>
          </div>
          <strong>{Math.round(dayProgress)} %</strong>
          <p>
            {last && minuteNow < timeToMinutes(last.end)
              ? `Fin dans ${durationLabel(timeToMinutes(last.end) - minuteNow)}`
              : todayCourses.length
                ? 'Terminée pour aujourd’hui'
                : 'Journée libre'}
          </p>
          <Progress value={dayProgress} className="mini-progress" />
        </article>
        <article className="mini-card next-card">
          <div>
            <CalendarDays size={19} />
            <span>Prochaine étape</span>
          </div>
          <strong>
            {next?.name ??
              (current ? `Fin de ${current.name}` : 'Planning à consulter')}
          </strong>
          <p>
            {next
              ? `${next.start} → ${next.end}`
              : current
                ? current.end
                : 'Préparez la suite'}
          </p>
          <button onClick={() => goTo('planning')}>
            Voir le planning <ArrowUpRight size={16} />
          </button>
        </article>
        <article className="mini-card revision-home-card">
          <div>
            <BrainCircuit size={19} />
            <span>Révision</span>
          </div>
          <strong>
            {mastery.review} carte{mastery.review > 1 ? 's' : ''} à revoir
          </strong>
          <p>{mastery.percentage} % de maîtrise globale</p>
          <button onClick={() => goTo('review')}>
            Lancer une session <ArrowUpRight size={16} />
          </button>
        </article>
      </section>
    </>
  );
}

function PlanningScreen({
  now,
  courses,
  setCourses,
  onOpenSettings,
}: {
  now: Date;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onOpenSettings: () => void;
}) {
  const [day, setDay] = useState(
    now.getDay() >= 1 && now.getDay() <= 5 ? now.getDay() : 1,
  );
  const blank = {
    name: '',
    start: '09:00',
    end: '10:00',
    room: '',
    type: 'course' as CourseType,
  };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const minuteNow = now.getHours() * 60 + now.getMinutes();
  const monday = useMemo(
    () => addDays(atStart(now), -((now.getDay() + 6) % 7)),
    [now],
  );
  const weekDates = useMemo(
    () => Array.from({ length: 5 }, (_, index) => addDays(monday, index)),
    [monday],
  );
  const selectedDate = weekDates[day - 1];
  const selectedKind = alternanceKind(selectedDate);
  const list = scheduleForDate(selectedDate, courses).sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const save = () => {
    if (!form.name.trim() || form.end <= form.start) return;
    if (editing)
      setCourses((prev) =>
        prev.map((c) => (c.id === editing ? { ...c, ...form, day } : c)),
      );
    else
      setCourses((prev) => [
        ...prev,
        { ...form, day, id: crypto.randomUUID() },
      ]);
    setForm(blank);
    setEditing(null);
  };
  const edit = (course: Course) => {
    setEditing(course.id);
    setForm({
      name: course.name,
      start: course.start,
      end: course.end,
      room: course.room,
      type: course.type,
    });
    document
      .getElementById('course-form')
      ?.scrollIntoView({ behavior: 'smooth' });
  };
  const isToday = dateKey(selectedDate) === dateKey(now);
  const editable = selectedKind === 'school';
  return (
    <section className="screen-section">
      <header className="section-header">
        <div>
          <p className="eyebrow">Semaine du {shortDate(monday)}</p>
          <h1>Planning</h1>
          <span className={`planning-mode ${selectedKind}`}>
            {selectedKind === 'company'
              ? 'Semaine en entreprise'
              : selectedKind === 'school'
                ? 'Semaine de cours'
                : selectedKind === 'holiday'
                  ? 'Jour férié'
                  : 'Repos'}
          </span>
        </div>
        <div className="header-actions">
          {editable ? (
            <button
              className="primary-icon"
              onClick={() =>
                document
                  .getElementById('course-form')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <Plus size={20} />
              <span>Ajouter</span>
            </button>
          ) : null}
          <button className="avatar small-avatar" onClick={onOpenSettings}>
            CS
          </button>
        </div>
      </header>
      <div className="day-picker" role="tablist">
        {weekDates.map((date, index) => (
          <button
            role="tab"
            aria-selected={day === index + 1}
            className={day === index + 1 ? 'active' : ''}
            onClick={() => setDay(index + 1)}
            key={dateKey(date)}
          >
            <span>{weekdays[index]}</span>
            <strong>{date.getDate()}</strong>
          </button>
        ))}
      </div>
      <div className="timeline">
        {list.map((course) => {
          const current =
            isToday &&
            minuteNow >= timeToMinutes(course.start) &&
            minuteNow < timeToMinutes(course.end);
          const done = isToday && minuteNow >= timeToMinutes(course.end);
          const generated = course.id.startsWith('company-');
          return (
            <article
              className={`timeline-item ${current ? 'current' : ''} ${done ? 'done' : ''}`}
              key={course.id}
            >
              <div className="timeline-time">
                <strong>{course.start}</strong>
                <span>{course.end}</span>
              </div>
              <div className="timeline-line">
                <i />
              </div>
              <div className="timeline-card">
                <div>
                  <span className={`type-dot ${course.type}`} />
                  {current && <span className="live-pill">En cours</span>}
                  <h3>{course.name}</h3>
                  {course.room && (
                    <p>
                      <MapPin size={14} />
                      {course.room}
                    </p>
                  )}
                </div>
                {!generated ? (
                  <div className="item-actions">
                    <button
                      aria-label={`Modifier ${course.name}`}
                      onClick={() => edit(course)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <button aria-label={`Supprimer ${course.name}`}>
                            <Trash2 size={16} />
                          </button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Supprimer « {course.name} » ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Ce créneau sera retiré de votre planning enregistré
                            sur cet appareil.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              setCourses((prev) =>
                                prev.filter((c) => c.id !== course.id),
                              )
                            }
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <span className="auto-pill">Auto</span>
                )}
              </div>
            </article>
          );
        })}
        {!list.length && (
          <div className="empty-state">
            <CalendarDays />
            <h3>Aucun créneau</h3>
            <p>
              {selectedKind === 'holiday'
                ? 'Jour férié ou journée sans cours.'
                : 'Journée libre.'}
            </p>
          </div>
        )}
      </div>
      {editable ? (
        <div className="edit-panel" id="course-form">
          <div className="panel-title">
            <div>
              <p className="eyebrow">
                {editing ? 'Modification' : 'Nouveau créneau'}
              </p>
              <h2>
                {editing
                  ? 'Mettre à jour le cours'
                  : `Ajouter au ${weekdays[day - 1].toLowerCase()}`}
              </h2>
            </div>
            {editing && (
              <button
                onClick={() => {
                  setEditing(null);
                  setForm(blank);
                }}
              >
                Annuler
              </button>
            )}
          </div>
          <div className="form-grid">
            <label className="wide">
              Nom
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex. Design d’interface"
              />
            </label>
            <label>
              Début
              <Input
                type="time"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </label>
            <label>
              Fin
              <Input
                type="time"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </label>
            <label>
              Salle
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="Facultatif"
              />
            </label>
            <label>
              Type
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as CourseType })
                }
              >
                <option value="course">Cours</option>
                <option value="work">Travail</option>
                <option value="break">Pause</option>
              </select>
            </label>
          </div>
          <button className="save-button" onClick={save}>
            <Check size={17} />
            {editing ? 'Enregistrer les modifications' : 'Ajouter au planning'}
          </button>
        </div>
      ) : (
        <div className="planning-auto-note">
          <Sparkles />
          <div>
            <strong>Horaires d’entreprise appliqués automatiquement</strong>
            <span>
              Du lundi au jeudi : 8h–12h30 et 13h–16h · Vendredi : 8h–12h.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function StatsScreen({
  now,
  settings,
  courses,
  hourly,
  learning,
  onOpenSettings,
}: {
  now: Date;
  settings: AppSettings;
  courses: Course[];
  hourly: number;
  learning: LearningState;
  onOpenSettings: () => void;
}) {
  const monday = addDays(atStart(now), -((now.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const schoolStart = dateFromKey(settings.schoolStart);
  const today = earnedForDate(now, now, courses, settings, hourly);
  const week = earnedBetween(monday, now, now, courses, settings, hourly);
  const month = earnedBetween(monthStart, now, now, courses, settings, hourly);
  const total = earnedBetween(schoolStart, now, now, courses, settings, hourly);
  const bars = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(now, index - 6);
    return {
      label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
        .format(date)
        .slice(0, 3),
      value: earnedForDate(date, now, courses, settings, hourly),
    };
  });
  const max = Math.max(...bars.map((b) => b.value), 1);
  const mastery = summarizeMastery(learning.data.flashcards, learning.progress);
  const revisionMinutes = Math.round(learning.progress.revisionSeconds / 60);
  const subjectMastery = learning.data.subjects
    .map((subject) => ({
      subject,
      summary: summarizeMastery(
        cardsForSubject(subject.id, learning.data.flashcards),
        learning.progress,
      ),
    }))
    .sort((a, b) => a.summary.percentage - b.summary.percentage);
  return (
    <section className="screen-section">
      <header className="section-header">
        <div>
          <p className="eyebrow">Vue d’ensemble</p>
          <h1>Statistiques</h1>
        </div>
        <div className="header-actions">
          <div className="header-chip">
            <TrendingUp size={17} /> En direct
          </div>
          <button className="avatar small-avatar" onClick={onOpenSettings}>
            CS
          </button>
        </div>
      </header>
      <article className="total-card">
        <div className="total-orb">
          <Coins size={26} />
        </div>
        <p>Gagnés au total</p>
        <strong>{money(total)} €</strong>
        <span>Depuis le {shortDate(schoolStart)}</span>
      </article>
      <div className="stat-grid">
        <article>
          <span>Par minute</span>
          <strong>{money(hourly / 60)} €</strong>
        </article>
        <article>
          <span>Par heure</span>
          <strong>{money(hourly)} €</strong>
        </article>
        <article>
          <span>Aujourd’hui</span>
          <strong>{money(today)} €</strong>
        </article>
        <article>
          <span>Cette semaine</span>
          <strong>{money(week)} €</strong>
        </article>
      </div>
      <article className="learning-stats-card">
        <div className="learning-stats-head">
          <div>
            <p className="eyebrow">Révisions</p>
            <h2>Maîtrise des cours</h2>
          </div>
          <strong>{mastery.percentage} %</strong>
        </div>
        <Progress
          value={mastery.percentage}
          className="learning-stat-progress"
        />
        <div className="learning-stat-metrics">
          <div>
            <span>Cartes révisées</span>
            <strong>{learning.progress.reviewedCount}</strong>
          </div>
          <div>
            <span>Temps de révision</span>
            <strong>{revisionMinutes} min</strong>
          </div>
          <div>
            <span>À revoir</span>
            <strong>{mastery.review}</strong>
          </div>
        </div>
        <p className="subject-stat-caption">Matières les plus difficiles</p>
        <div className="subject-stat-list">
          {subjectMastery.map(({ subject, summary }) => (
            <div key={subject.id}>
              <span style={{ background: subject.accent }} />
              <strong>{subject.name}</strong>
              <Progress
                value={summary.percentage}
                className="subject-stat-progress"
              />
              <b>{summary.percentage} %</b>
            </div>
          ))}
        </div>
      </article>
      <article className="chart-card">
        <div className="chart-head">
          <div>
            <p className="eyebrow">7 derniers jours</p>
            <h2>Revenus estimés</h2>
          </div>
          <strong>{money(week)} €</strong>
        </div>
        <div className="bar-chart">
          {bars.map((bar, i) => (
            <div className="bar-column" key={`${bar.label}-${i}`}>
              <div className="bar-value">
                {bar.value ? Math.round(bar.value) : ''}
              </div>
              <div className="bar-rail">
                <div
                  style={{ height: `${Math.max(5, (bar.value / max) * 100)}%` }}
                />
              </div>
              <span>{bar.label}</span>
            </div>
          ))}
        </div>
      </article>
      <div className="long-stats">
        <article>
          <span>Ce mois</span>
          <strong>{money(month)} €</strong>
          <ChevronRight />
        </article>
        <article>
          <span>Depuis le début</span>
          <strong>{money(total)} €</strong>
          <ChevronRight />
        </article>
      </div>
    </section>
  );
}

function SettingsScreen({
  settings,
  setSettings,
  canInstall,
  isInstalled,
  onInstall,
}: {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
}) {
  const hourly = settings.manualRateEnabled
    ? settings.manualRate
    : settings.salary / ((settings.hoursWeek * 52) / 12);
  return (
    <section className="screen-section">
      <header className="section-header">
        <div>
          <p className="eyebrow">Profil & préférences</p>
          <h1>Réglages</h1>
        </div>
        <div className="saved-chip">
          <Check size={15} /> Sauvegardé
        </div>
      </header>
      <article className="settings-card pwa-settings-card">
        <div className="settings-title">
          <div className="settings-icon pwa-icon">
            <Smartphone />
          </div>
          <div>
            <h2>Installer Tempo</h2>
            <p>Utilisez l’application comme une app, même sans connexion.</p>
          </div>
        </div>
        <div className="pwa-install-row">
          <div>
            <strong>
              {isInstalled
                ? 'Tempo est installée'
                : 'Ajouter à l’écran d’accueil'}
            </strong>
            <span>
              {isInstalled
                ? 'L’application s’ouvre maintenant dans sa propre fenêtre.'
                : canInstall
                  ? 'Installation rapide, sans passer par un store.'
                  : 'Sur iPhone : Partager puis « Sur l’écran d’accueil ».'}
            </span>
          </div>
          <button onClick={onInstall} disabled={!canInstall || isInstalled}>
            {isInstalled ? <Check /> : <Download />}
            {isInstalled ? 'Installée' : 'Installer'}
          </button>
        </div>
      </article>
      <article className="settings-card">
        <div className="settings-title">
          <div className="settings-icon purple">
            <WalletCards />
          </div>
          <div>
            <h2>Salaire</h2>
            <p>Calculez votre équivalent en temps réel.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Salaire mensuel net
            <Input
              type="number"
              min="0"
              value={settings.salary}
              onChange={(e) =>
                setSettings({ ...settings, salary: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Heures par semaine
            <Input
              type="number"
              min="1"
              value={settings.hoursWeek}
              onChange={(e) =>
                setSettings({ ...settings, hoursWeek: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <div className="switch-row">
          <div>
            <strong>Taux horaire manuel</strong>
            <span>Remplacer le calcul automatique</span>
          </div>
          <Switch
            checked={settings.manualRateEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, manualRateEnabled: checked })
            }
          />
        </div>
        {settings.manualRateEnabled && (
          <label className="standalone-label">
            Taux horaire
            <Input
              type="number"
              min="0"
              step="0.01"
              value={settings.manualRate}
              onChange={(e) =>
                setSettings({ ...settings, manualRate: Number(e.target.value) })
              }
            />
          </label>
        )}
        <div className="rate-strip">
          <div>
            <span>Heure</span>
            <strong>{money(hourly)} €</strong>
          </div>
          <div>
            <span>Minute</span>
            <strong>{money(hourly / 60)} €</strong>
          </div>
          <div>
            <span>Seconde</span>
            <strong>
              {(hourly / 3600).toLocaleString('fr-FR', {
                maximumFractionDigits: 4,
              })}{' '}
              €
            </strong>
          </div>
        </div>
      </article>
      <article className="settings-card">
        <div className="settings-title">
          <div className="settings-icon blue">
            <CalendarDays />
          </div>
          <div>
            <h2>Année scolaire</h2>
            <p>Définissez la période suivie sur l’accueil.</p>
          </div>
        </div>
        <div className="calendar-import">
          <Check size={17} />
          <div>
            <strong>Calendrier BTS ERPC 2026–2027 importé</strong>
            <span>2e colonne · jaune = lycée · blanc = entreprise</span>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Date de début
            <Input
              type="date"
              value={settings.schoolStart}
              onChange={(e) =>
                setSettings({ ...settings, schoolStart: e.target.value })
              }
            />
          </label>
          <label>
            Date de fin
            <Input
              type="date"
              value={settings.schoolEnd}
              onChange={(e) =>
                setSettings({ ...settings, schoolEnd: e.target.value })
              }
            />
          </label>
        </div>
        <fieldset className="mode-field">
          <legend>Mode de calcul</legend>
          <RadioGroup
            value={settings.calculationMode}
            onValueChange={(value) =>
              setSettings({
                ...settings,
                calculationMode: value as AppSettings['calculationMode'],
              })
            }
          >
            <label
              className={`mode-option ${settings.calculationMode === 'calendar' ? 'selected' : ''}`}
            >
              <RadioGroupItem value="calendar" />
              <span>
                <strong>Jours calendaires</strong>
                <small>Tous les jours entre le début et la fin.</small>
              </span>
            </label>
            <label
              className={`mode-option ${settings.calculationMode === 'work' ? 'selected' : ''}`}
            >
              <RadioGroupItem value="work" />
              <span>
                <strong>Cours / travail uniquement</strong>
                <small>
                  Utilise le rythme lycée / entreprise importé et ignore les
                  jours exclus.
                </small>
              </span>
            </label>
          </RadioGroup>
        </fieldset>
        <label className="standalone-label">
          Jours fériés et jours sans cours{' '}
          <small>Dates séparées par une virgule</small>
          <textarea
            value={settings.excludedDates.join(', ')}
            onChange={(e) =>
              setSettings({
                ...settings,
                excludedDates: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
            placeholder="2026-11-11, 2027-05-17"
          />
        </label>
      </article>
    </section>
  );
}

const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'planning', label: 'Planning', icon: CalendarDays },
  { id: 'courses', label: 'Cours', icon: BookOpen },
  { id: 'review', label: 'Réviser', icon: BrainCircuit },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

export default function Page() {
  const [tab, setTab] = useState<Tab>('home');
  const [now, setNow] = useState(() => new Date());
  const [settings, setSettings] = useState(defaultSettings);
  const [courses, setCourses] = useState(defaultCourses);
  const [hydrated, setHydrated] = useState(false);
  const [learning, setLearning] = useState<LearningState>(() =>
    loadLearningState(),
  );
  const [revisionRequest, setRevisionRequest] = useState<string[]>([]);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('tempo-settings');
      const savedCourses = localStorage.getItem('tempo-courses');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as AppSettings;
        if (
          localStorage.getItem('tempo-calendar-version') !== CALENDAR_VERSION
        ) {
          setSettings({
            ...parsed,
            schoolStart: '2026-09-01',
            schoolEnd: '2027-07-31',
            excludedDates: importedHolidays,
          });
          localStorage.setItem('tempo-calendar-version', CALENDAR_VERSION);
        } else setSettings(parsed);
      } else {
        setSettings(defaultSettings);
        localStorage.setItem('tempo-calendar-version', CALENDAR_VERSION);
      }
      if (localStorage.getItem('tempo-schedule-version') !== SCHEDULE_VERSION) {
        setVariousScheduleDefaults();
      } else if (savedCourses) setCourses(JSON.parse(savedCourses));
    } finally {
      setHydrated(true);
    }

    function setVariousScheduleDefaults() {
      setCourses(defaultCourses);
      localStorage.setItem('tempo-courses', JSON.stringify(defaultCourses));
      localStorage.setItem('tempo-schedule-version', SCHEDULE_VERSION);
    }
  }, []);
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('tempo-settings', JSON.stringify(settings));
      localStorage.setItem('tempo-courses', JSON.stringify(courses));
    }
  }, [settings, courses, hydrated]);
  useEffect(() => {
    saveLearningState(learning);
  }, [learning]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'update_school_period',
          title: 'Mettre à jour l’année scolaire',
          description:
            'Met à jour les dates et le mode de calcul de la progression annuelle affichée dans Tempo.',
          inputSchema: {
            type: 'object',
            properties: {
              start: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
              end: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
              mode: { type: 'string', enum: ['calendar', 'work'] },
            },
            required: ['start', 'end', 'mode'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const value = input as {
              start?: string;
              end?: string;
              mode?: 'calendar' | 'work';
            };
            if (
              !value.start ||
              !value.end ||
              value.start >= value.end ||
              !['calendar', 'work'].includes(value.mode ?? '')
            )
              throw new Error('Période ou mode invalide');
            setSettings((prev) => ({
              ...prev,
              schoolStart: value.start!,
              schoolEnd: value.end!,
              calculationMode: value.mode!,
            }));
            return {
              status: 'updated',
              start: value.start,
              end: value.end,
              mode: value.mode,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const hourly = settings.manualRateEnabled
    ? settings.manualRate
    : settings.salary / ((settings.hoursWeek * 52) / 12);
  const updateLearningData = (data: LearningData) =>
    setLearning((current) => ({ ...current, data }));
  const updateRevisionProgress = (progress: RevisionProgress) =>
    setLearning((current) => ({ ...current, progress }));
  const openSettings = () => setTab('settings');
  const installPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };
  const startRevision = (courseIds: string[]) => {
    setRevisionRequest(courseIds);
    setTab('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="app-content">
        {tab === 'home' && (
          <HomeScreen
            now={now}
            settings={settings}
            courses={courses}
            hourly={hourly}
            learning={learning}
            goTo={setTab}
          />
        )}
        {tab === 'planning' && (
          <PlanningScreen
            now={now}
            courses={courses}
            setCourses={setCourses}
            onOpenSettings={openSettings}
          />
        )}
        {tab === 'courses' && (
          <CoursesView
            data={learning.data}
            progress={learning.progress}
            onDataChange={updateLearningData}
            onStartRevision={startRevision}
            onOpenSettings={openSettings}
          />
        )}
        {tab === 'review' && (
          <RevisionView
            data={learning.data}
            progress={learning.progress}
            requestedCourseIds={revisionRequest}
            onProgressChange={updateRevisionProgress}
            onOpenCourses={() => setTab('courses')}
            onOpenSettings={openSettings}
          />
        )}
        {tab === 'stats' && (
          <StatsScreen
            now={now}
            settings={settings}
            courses={courses}
            hourly={hourly}
            learning={learning}
            onOpenSettings={openSettings}
          />
        )}
        {tab === 'settings' && (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            canInstall={Boolean(installPrompt)}
            isInstalled={isInstalled}
            onInstall={() => void installPwa()}
          />
        )}
      </div>
      <nav className="bottom-nav" aria-label="Navigation principale">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            className={tab === id ? 'active' : ''}
            onClick={() => {
              setTab(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            key={id}
            aria-current={tab === id ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={2.1} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
