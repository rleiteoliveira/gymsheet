'use client';

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CirclePlus,
  Database,
  Dumbbell,
  FileDown,
  FileJson,
  FolderOpen,
  History,
  Info,
  ListPlus,
  Pin,
  PinOff,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SkipForward,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createBackup, loadAppState, parseBackup, restoreAppState, saveAppState } from '@/lib/storage';
import { FALLBACK_EXERCISES, imageUrl, loadCatalog, toSnapshot } from '@/lib/catalog';
import { filterCatalogExercises, muscleGroupsForCatalog } from '@/lib/catalog-filter';
import { calendarGrid, localNoonIso, monthStart, monthTitle, parseLocalDateKey, sessionsForDate } from '@/lib/calendar';
import { normalizeEmojiInput } from '@/lib/emoji';
import { computeFavoriteScores, rankCatalogExercises } from '@/lib/favorites';
import {
  applySessionEdit,
  clonePlanExercise,
  completeSession,
  createSessionFromPlan,
  decideSessionStart,
  localCivilDateTime,
  localCivilDateKey as localDateKey,
} from '@/lib/session';
import type {
  AppState,
  CatalogExercise,
  CatalogSource,
  ExerciseStatus,
  Plan,
  PlanExercise,
  Session,
  SessionExercise,
  SetRecord,
} from '@/lib/types';
import { STATUS_HINTS, STATUS_LABELS } from '@/lib/types';

type Tab = 'today' | 'folder' | 'week' | 'data';
type FolderTab = 'plans' | 'sessions';
type PickerMode = 'plan' | 'swap' | 'add';
type Modal = 'plan' | 'picker' | null;

interface PlanDraft {
  id?: string;
  name: string;
  emoji: string;
  exercises: PlanExercise[];
}

interface CatalogState {
  source: CatalogSource;
  savedAt?: string;
  error?: string;
}

interface PendingSessionStart {
  previousSessionId: string;
  planId: string | null;
}

const EMPTY_STATE: AppState = { plans: [], sessions: [], todayPin: null };

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clonePlan(plan: Plan): PlanDraft {
  return {
    id: plan.id,
    name: plan.name,
    emoji: plan.emoji ?? '',
    exercises: plan.exercises.map(clonePlanExercise),
  };
}

function shiftMonth(input: Date, amount: number) {
  return new Date(input.getFullYear(), input.getMonth() + amount, 1, 12, 0, 0, 0);
}

function startOfCurrentWeek(now = new Date()) {
  const date = new Date(now);
  const dayFromMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayFromMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfCurrentWeek(now = new Date()) {
  const end = startOfCurrentWeek(now);
  end.setDate(end.getDate() + 7);
  return end;
}

const CALENDAR_WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

function formatDate(input: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...options,
  }).format(typeof input === 'string' ? new Date(input) : input);
}

function formatDateTime(input: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(input));
}

function formatDateKeyLabel(dateKey: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    ...options,
  }).format(parseLocalDateKey(dateKey));
}

function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Peso corporal';
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

function parseDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function localizeEquipment(value: string | null) {
  const labels: Record<string, string> = {
    'body only': 'peso corporal',
    dumbbell: 'halteres',
    barbell: 'barra',
    machine: 'máquina',
    cable: 'cabo',
    kettlebells: 'kettlebell',
    bands: 'elástico',
    other: 'outro',
  };
  return value ? labels[value] ?? value : 'equipamento livre';
}

function localizeMuscle(value: string | undefined) {
  const labels: Record<string, string> = {
    abdominals: 'abdômen',
    abductors: 'abdutores',
    adductors: 'adutores',
    biceps: 'bíceps',
    calves: 'panturrilhas',
    chest: 'peito',
    forearms: 'antebraços',
    glutes: 'glúteos',
    hamstrings: 'posteriores',
    lats: 'dorsais',
    'lower back': 'lombar',
    'middle back': 'costas',
    neck: 'pescoço',
    quadriceps: 'quadríceps',
    shoulders: 'ombros',
    traps: 'trapézio',
    triceps: 'tríceps',
  };
  return value ? labels[value] ?? value : 'força';
}

function statusIcon(status: ExerciseStatus) {
  if (status === 'done') return <Check size={13} strokeWidth={3} />;
  if (status === 'skipped') return <SkipForward size={13} />;
  if (status === 'swapped') return <RotateCcw size={13} />;
  return <Plus size={13} strokeWidth={3} />;
}

function StatusChip({ status }: { status: ExerciseStatus }) {
  return (
    <span className={`status-chip ${status}`} title={STATUS_HINTS[status]}>
      {statusIcon(status)} {STATUS_LABELS[status]}
    </span>
  );
}

function ExerciseImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = imageUrl(src);
  if (!resolved || failed) {
    return (
      <div className="exercise-image" aria-label={`Imagem indisponível de ${alt}`}>
        <Dumbbell size={20} style={{ margin: 14, color: 'var(--muted-2)' }} />
      </div>
    );
  }
  return (
    <div className="exercise-image">
      {/* oxlint-disable-next-line next/no-img-element -- remote catalog imagery is intentionally unoptimized */}
      <img src={resolved} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

function getWeekStats(sessions: Session[], now = new Date()) {
  const start = startOfCurrentWeek(now);
  const end = endOfCurrentWeek(now);
  const inWeek = sessions.filter((session) => {
    const time = new Date(session.startedAt).getTime();
    return time >= start.getTime() && time < end.getTime();
  });
  const trainedDates = new Set<string>();
  let series = 0;
  const skipped = new Map<string, number>();
  const swapped = new Map<string, { count: number; planned: string; performed: string }>();
  const added = new Map<string, number>();

  for (const session of inWeek) {
    if (session.state === 'completed') trainedDates.add(localDateKey(session.startedAt));
    for (const exercise of session.exercises) {
      series += exercise.sets.length;
      if (exercise.status === 'skipped' && exercise.planned) {
        const key = exercise.planned.exercise.name;
        skipped.set(key, (skipped.get(key) ?? 0) + 1);
      }
      if (exercise.status === 'swapped' && exercise.planned && exercise.performed) {
        const key = `${exercise.planned.exercise.name} → ${exercise.performed.name}`;
        const item = swapped.get(key) ?? { count: 0, planned: exercise.planned.exercise.name, performed: exercise.performed.name };
        swapped.set(key, { ...item, count: item.count + 1 });
      }
      if (exercise.status === 'added' && exercise.performed) {
        const key = exercise.performed.name;
        added.set(key, (added.get(key) ?? 0) + 1);
      }
    }
  }

  const list = (map: Map<string, number>) => [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    sessions: inWeek.length,
    days: trainedDates.size,
    series,
    skipped: list(skipped),
    swapped: [...swapped.entries()]
      .map(([label, value]) => ({ label, count: value.count, detail: `${value.planned} → ${value.performed}` }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    added: list(added),
    label: `${formatDate(start)} — ${formatDate(new Date(end.getTime() - 1), { year: 'numeric' })}`,
  };
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(sessions: Session[]) {
  const rows: Array<Array<string | number | null>> = [
    ['sessao_id', 'estado_sessao', 'inicio', 'fim', 'ficha_id', 'ficha_nome', 'ordem', 'serie', 'status', 'planejado_id', 'planejado_nome', 'feito_id', 'feito_nome', 'kg', 'reps'],
  ];
  for (const session of [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    for (const exercise of session.exercises) {
      const base = [
        session.id,
        session.state,
        localCivilDateTime(session.startedAt),
        session.completedAt ? localCivilDateTime(session.completedAt) : null,
        session.sourcePlanId ?? null,
        session.sourcePlanName ?? null,
        exercise.order + 1,
      ];
      const planned = exercise.planned?.exercise;
      const performed = exercise.performed;
      if (exercise.status === 'skipped') {
        const targetSets = exercise.planned?.targetSets ?? 1;
        for (let index = 1; index <= targetSets; index += 1) {
          rows.push([...base, index, 'skipped', planned?.id ?? null, planned?.name ?? null, null, null, null, null]);
        }
      } else {
        for (const set of exercise.sets) {
          rows.push([...base, set.index, exercise.status ?? null, planned?.id ?? null, planned?.name ?? null, performed?.id ?? null, performed?.name ?? null, set.kg === null ? null : set.kg.toString().replace('.', ','), set.reps]);
        }
      }
    }
  }
  return `\ufeff${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sourceLabel(source: CatalogSource) {
  if (source === 'live') return 'Catálogo ao vivo';
  if (source === 'cached') return 'Catálogo salvo';
  return '40 compostos offline';
}

function isValidBuildId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(value);
}

export default function Home() {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [catalog, setCatalog] = useState<CatalogExercise[]>(FALLBACK_EXERCISES);
  const [catalogMeta, setCatalogMeta] = useState<CatalogState>({ source: 'fallback' });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('today');
  const [folderTab, setFolderTab] = useState<FolderTab>('plans');
  const [sessionViewId, setSessionViewId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [composerKg, setComposerKg] = useState('');
  const [composerReps, setComposerReps] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('plan');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscleGroups, setPickerMuscleGroups] = useState<string[]>([]);
  const [pickerSessionExerciseId, setPickerSessionExerciseId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [pendingSessionStart, setPendingSessionStart] = useState<PendingSessionStart | null>(null);
  const [calendarCursor, setCalendarCursor] = useState(() => monthStart(new Date()));
  const [calendarSelectedDateKey, setCalendarSelectedDateKey] = useState(() => localDateKey(new Date()));
  const [retroactiveDateKey, setRetroactiveDateKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const serviceWorkerRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadAfterServiceWorkerUpdateRef = useRef(false);

  const notify = useCallback((message: string) => setToast(message), []);

  const mutate = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => {
      const next = updater(current);
      void saveAppState(next).catch(() => setToast('Não consegui salvar localmente. Faça um backup assim que possível.'));
      return next;
    });
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const result = await loadCatalog();
    setCatalog(result.exercises);
    setCatalogMeta({ source: result.source, savedAt: result.savedAt, error: result.error });
    setCatalogLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([loadAppState(), loadCatalog()])
      .then(([storedState, catalogResult]) => {
        if (!mounted) return;
        setState(storedState);
        setCatalog(catalogResult.exercises);
        setCatalogMeta({ source: catalogResult.source, savedAt: catalogResult.savedAt, error: catalogResult.error });
        setCatalogLoading(false);
        setReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setCatalogLoading(false);
        setReady(true);
        notify('Comecei com um espaço local novo.');
      });

    let disposeServiceWorker: (() => void) | undefined;
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        let buildId = 'dev';
        try {
          const response = await fetch(`/build-meta.json?ts=${Date.now()}`, { cache: 'no-store' });
          if (response.ok) {
            const payload: unknown = await response.json();
            if (payload && typeof payload === 'object' && 'buildId' in payload && isValidBuildId(payload.buildId)) {
              buildId = payload.buildId;
            }
          }
        } catch {
          // Offline startup can use the existing worker and its cached shell.
        }
        if (!mounted) return;

        try {
          const registration = await navigator.serviceWorker.register(`/sw.js?build=${encodeURIComponent(buildId)}`, { updateViaCache: 'none' });
          if (!mounted) return;
          serviceWorkerRegistrationRef.current = registration;
          const announceUpdate = () => {
            if (mounted && navigator.serviceWorker.controller) setUpdateReady(true);
          };
          if (registration.waiting) announceUpdate();
          const workerStateHandlers = new Map<ServiceWorker, () => void>();
          const onUpdateFound = () => {
            const worker = registration.installing;
            if (!worker) return;
            const onStateChange = () => {
              if (worker.state === 'installed') announceUpdate();
            };
            workerStateHandlers.set(worker, onStateChange);
            worker.addEventListener('statechange', onStateChange);
          };
          const onControllerChange = () => {
            if (reloadAfterServiceWorkerUpdateRef.current) window.location.reload();
          };
          registration.addEventListener('updatefound', onUpdateFound);
          navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
          serviceWorkerRegistrationRef.current = registration;
          return () => {
            registration.removeEventListener('updatefound', onUpdateFound);
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            workerStateHandlers.forEach((handler, worker) => worker.removeEventListener('statechange', handler));
            workerStateHandlers.clear();
          };
        } catch {
          // A browser may reject service workers in private or restricted contexts.
        }
        return undefined;
      };
      void registerServiceWorker().then((dispose) => {
        if (!mounted) {
          dispose?.();
          return;
        }
        disposeServiceWorker = dispose;
      });
    }

    const updateViewport = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--visual-height', `${height}px`);
    };
    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    return () => {
      mounted = false;
      disposeServiceWorker?.();
      serviceWorkerRegistrationRef.current = null;
      reloadAfterServiceWorkerUpdateRef.current = false;
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, [notify]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pinnedPlan = state.todayPin?.kind === 'plan' ? state.plans.find((plan) => plan.id === state.todayPin?.id) : undefined;
  const pinnedSession = state.todayPin?.kind === 'session' ? state.sessions.find((session) => session.id === state.todayPin?.id) : undefined;
  const activeSession = sessionViewId ? state.sessions.find((session) => session.id === sessionViewId) : undefined;
  const todayKey = localDateKey(new Date());
  const today = useMemo(() => parseLocalDateKey(todayKey), [todayKey]);
  const weekStats = useMemo(() => getWeekStats(state.sessions), [state.sessions]);
  const recentSessions = useMemo(() => [...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 5), [state.sessions]);
  const calendarDays = useMemo(() => calendarGrid(calendarCursor, state.sessions, today), [calendarCursor, state.sessions, today]);
  const selectedCalendarSessions = useMemo(() => sessionsForDate(state.sessions, calendarSelectedDateKey), [state.sessions, calendarSelectedDateKey]);
  const favoriteScores = useMemo(() => computeFavoriteScores(state.sessions, today), [state.sessions, today]);
  const pickerMuscleOptions = useMemo(() => muscleGroupsForCatalog(catalog), [catalog]);
  const pickerMatches = useMemo(
    () => rankCatalogExercises(filterCatalogExercises(catalog, pickerSearch, pickerMuscleGroups), favoriteScores),
    [catalog, favoriteScores, pickerMuscleGroups, pickerSearch],
  );
  const filteredPicker = pickerMatches.slice(0, 80);

  function openPlanEditor(plan?: Plan) {
    setDraft(plan ? clonePlan(plan) : { name: '', emoji: '', exercises: [] });
    setModal('plan');
  }

  function openPicker(mode: PickerMode, sessionExerciseId?: string) {
    setPickerMode(mode);
    setPickerSessionExerciseId(sessionExerciseId ?? null);
    setPickerSearch('');
    setPickerMuscleGroups([]);
    setModal('picker');
  }

  function togglePickerMuscle(groupId: string) {
    setPickerMuscleGroups((current) => current.includes(groupId)
      ? current.filter((item) => item !== groupId)
      : [...current, groupId]);
  }

  function pinPlan(planId: string) {
    if (state.todayPin?.kind === 'session') {
      notify('Finalize ou retome a sessão atual antes de trocar o pin.');
      return;
    }
    mutate((current) => ({ ...current, todayPin: { kind: 'plan', id: planId } }));
    notify('Ficha fixada em Hoje.');
  }

  function clearPin() {
    mutate((current) => ({ ...current, todayPin: null }));
    notify('Pin removido.');
  }

  function notifySessionChange(session: Session, currentDayMessage: string) {
    if (localDateKey(session.startedAt) !== localDateKey(new Date())) {
      notify(`Correção salva em ${formatDateKeyLabel(localDateKey(session.startedAt))}.`);
      return;
    }
    notify(currentDayMessage);
  }

  function openSession(sessionId: string) {
    setSessionViewId(sessionId);
    setActiveExerciseId(null);
    setComposerKg('');
    setComposerReps('');
  }

  function selectCalendarDate(day: { date: Date; dateKey: string; inCurrentMonth: boolean; isFuture: boolean }) {
    if (day.isFuture) return;
    setCalendarSelectedDateKey(day.dateKey);
    if (!day.inCurrentMonth) setCalendarCursor(monthStart(day.date));
  }

  function openRetroactiveSession(dateKey = calendarSelectedDateKey) {
    if (dateKey > localDateKey(new Date())) {
      notify('Escolha hoje ou um dia anterior para criar uma sessão.');
      return;
    }
    setRetroactiveDateKey(dateKey);
  }

  function createCalendarSession(plan?: Plan) {
    if (!retroactiveDateKey) return;
    const todayKey = localDateKey(new Date());
    const isToday = retroactiveDateKey === todayKey;
    const startedAt = isToday ? new Date() : new Date(localNoonIso(retroactiveDateKey));
    const session = createSessionFromPlan(plan, startedAt, makeId);
    mutate((current) => ({
      ...current,
      sessions: [...current.sessions, session],
      todayPin: isToday ? { kind: 'session', id: session.id } : current.todayPin,
    }));
    setRetroactiveDateKey(null);
    setCalendarSelectedDateKey(retroactiveDateKey);
    setCalendarCursor(monthStart(parseLocalDateKey(retroactiveDateKey)));
    openSession(session.id);
    notify(isToday ? 'Sessão criada para hoje.' : `Sessão criada em ${formatDateKeyLabel(retroactiveDateKey)} para correção.`);
  }

  function startSession(plan?: Plan) {
    const selectedPlan = plan ?? pinnedPlan;
    const decision = decideSessionStart(state.sessions, new Date());
    if (decision.kind === 'resume-today') {
      setSessionViewId(decision.session.id);
      setActiveExerciseId(null);
      return;
    }
    if (decision.kind === 'choose-previous') {
      setPendingSessionStart({
        previousSessionId: decision.session.id,
        planId: selectedPlan?.id ?? null,
      });
      return;
    }
    const session = createSessionFromPlan(selectedPlan, new Date(), makeId);
    mutate((current) => ({
      ...current,
      sessions: [...current.sessions, session],
      todayPin: { kind: 'session', id: session.id },
    }));
    setSessionViewId(session.id);
    setActiveExerciseId(null);
    notify(selectedPlan ? `Sessão ${selectedPlan.name} começou.` : 'Sessão vazia começou.');
  }

  function resumePreviousSession() {
    if (!pendingSessionStart) return;
    const previous = state.sessions.find((session) => session.id === pendingSessionStart.previousSessionId);
    setPendingSessionStart(null);
    if (previous) {
      setSessionViewId(previous.id);
      setActiveExerciseId(null);
    }
  }

  function completePreviousAndStartToday() {
    if (!pendingSessionStart) return;
    const now = new Date();
    const selectedPlan = pendingSessionStart.planId
      ? state.plans.find((plan) => plan.id === pendingSessionStart.planId)
      : undefined;
    const nextSession = createSessionFromPlan(selectedPlan, now, makeId);
    const previousSessionId = pendingSessionStart.previousSessionId;
    mutate((current) => ({
      ...current,
      sessions: [
        ...current.sessions.map((session) =>
          session.id === previousSessionId ? completeSession(session, now) : session,
        ),
        nextSession,
      ],
      todayPin: { kind: 'session', id: nextSession.id },
    }));
    setPendingSessionStart(null);
    setSessionViewId(nextSession.id);
    setActiveExerciseId(null);
    notify(selectedPlan ? `Sessão ${selectedPlan.name} começou hoje.` : 'Sessão vazia começou hoje.');
  }

  function selectExerciseForRegister(exercise: SessionExercise) {
    setActiveExerciseId(exercise.id);
    const lastSet = exercise.sets.at(-1);
    const target = exercise.planned;
    setComposerKg(lastSet ? (lastSet.kg === null ? '' : String(lastSet.kg).replace('.', ',')) : target?.targetKg == null ? '' : String(target.targetKg).replace('.', ','));
    setComposerReps(lastSet ? String(lastSet.reps) : target ? String(target.targetReps) : '');
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#composer-kg')?.focus(), 0);
  }

  function saveSet() {
    if (!activeSession || !activeExerciseId) return;
    const reps = Number(composerReps);
    if (!Number.isInteger(reps) || reps < 1 || reps > 999) {
      notify('Informe reps inteiras entre 1 e 999.');
      return;
    }
    const kg = parseDecimal(composerKg);
    if (composerKg.trim() && kg === null) {
      notify('Informe um peso válido ou deixe em branco para peso corporal.');
      return;
    }
    const now = new Date().toISOString();
    mutate((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== activeSession.id) return session;
        const exercise = session.exercises.find((item) => item.id === activeExerciseId);
        if (!exercise) return session;
        const set: SetRecord = { id: makeId(), index: exercise.sets.length + 1, kg, reps, savedAt: now };
        return applySessionEdit(session, { type: 'save-set', exerciseId: activeExerciseId, set });
      }),
    }));
    setActiveExerciseId(null);
    notifySessionChange(activeSession, 'Série salva.');
  }

  function markSkipped(exerciseId: string) {
    const target = state.sessions.find((session) => session.id === sessionViewId);
    mutate((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id !== sessionViewId ? session : applySessionEdit(session, { type: 'skip', exerciseId }),
      ),
    }));
    if (activeExerciseId === exerciseId) setActiveExerciseId(null);
    if (target) notifySessionChange(target, 'Exercício marcado como pulado.');
  }

  function undoExercise(exerciseId: string) {
    const target = state.sessions.find((session) => session.id === sessionViewId);
    mutate((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id !== sessionViewId ? session : applySessionEdit(session, { type: 'undo', exerciseId }),
      ),
    }));
    if (activeExerciseId === exerciseId) setActiveExerciseId(null);
    if (target) notifySessionChange(target, 'Status desfeito.');
  }

  function finishSession() {
    if (!activeSession || activeSession.state === 'completed') return;
    const pending = activeSession.exercises.filter((exercise) => exercise.status === null);
    if (pending.length && !window.confirm(`${pending.length} exercício(s) ainda estão pendentes. Marcar como pulado e finalizar?`)) return;
    const invalid = activeSession.exercises.some((exercise) => exercise.status !== null && exercise.status !== 'skipped' && exercise.sets.length === 0);
    if (invalid) {
      notify('Salve ao menos uma série nos exercícios trocados ou adicionados.');
      return;
    }
    const completedAt = new Date();
    mutate((current) => ({
      ...current,
      todayPin: current.todayPin?.kind === 'session' && current.todayPin.id === activeSession.id ? null : current.todayPin,
      sessions: current.sessions.map((session) =>
        session.id !== activeSession.id ? session : completeSession(session, completedAt),
      ),
    }));
    setSessionViewId(null);
    setActiveExerciseId(null);
    setTab('today');
    notifySessionChange(activeSession, 'Sessão finalizada e salva.');
  }

  function discardSession(sessionId?: string) {
    const targetId = sessionId ?? activeSession?.id;
    const target = targetId ? state.sessions.find((session) => session.id === targetId) : undefined;
    if (!target || !window.confirm('Descartar esta sessão? Isso não pode ser desfeito.')) return;
    mutate((current) => ({
      ...current,
      todayPin: current.todayPin?.kind === 'session' && current.todayPin.id === target.id ? null : current.todayPin,
      sessions: current.sessions.filter((session) => session.id !== target.id),
    }));
    if (sessionViewId === target.id) {
      setSessionViewId(null);
      setActiveExerciseId(null);
    }
    notify('Sessão descartada.');
  }

  function savePlan() {
    if (!draft?.name.trim()) {
      notify('Dê um nome para a ficha.');
      return;
    }
    if (!draft.exercises.length) {
      notify('Adicione pelo menos um exercício.');
      return;
    }
    const emoji = normalizeEmojiInput(draft.emoji);
    if (!emoji.valid) {
      notify('Use apenas um emoji na ficha.');
      return;
    }
    const now = new Date().toISOString();
    const existing = draft.id ? state.plans.find((plan) => plan.id === draft.id) : undefined;
    const plan: Plan = {
      id: draft.id ?? makeId(),
      name: draft.name.trim(),
      emoji: emoji.value,
      exercises: draft.exercises.map((exercise, index) => ({ ...exercise, order: index })),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    mutate((current) => ({ ...current, plans: existing ? current.plans.map((item) => item.id === plan.id ? plan : item) : [...current.plans, plan] }));
    setModal(null);
    setDraft(null);
    notify(existing ? 'Ficha atualizada.' : 'Ficha criada.');
  }

  function deletePlan(planId: string) {
    const plan = state.plans.find((item) => item.id === planId);
    if (!plan || !window.confirm(`Excluir a ficha “${plan.name}”?`)) return;
    mutate((current) => ({
      ...current,
      plans: current.plans.filter((item) => item.id !== planId),
      todayPin: current.todayPin?.kind === 'plan' && current.todayPin.id === planId ? null : current.todayPin,
    }));
    notify('Ficha excluída.');
  }

  function handleCatalogPick(exercise: CatalogExercise) {
    if (pickerMode === 'plan') {
      if (!draft) return;
      if (draft.exercises.some((item) => item.exercise.id === exercise.id)) {
        notify('Esse exercício já está na ficha.');
        return;
      }
      const nextExercise: PlanExercise = {
        id: makeId(),
        order: draft.exercises.length,
        exercise: toSnapshot(exercise),
        targetSets: 3,
        targetReps: 10,
        targetKg: null,
      };
      setDraft((current) => current ? { ...current, exercises: [...current.exercises, nextExercise] } : current);
      setModal('plan');
      return;
    }

    if (!sessionViewId) return;
    if (pickerMode === 'swap' && pickerSessionExerciseId) {
      mutate((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id !== sessionViewId
            ? session
            : applySessionEdit(session, {
                type: 'swap',
                exerciseId: pickerSessionExerciseId,
                performed: toSnapshot(exercise),
              }),
        ),
      }));
      setActiveExerciseId(pickerSessionExerciseId);
      setComposerKg('');
      setComposerReps('10');
      setModal(null);
      if (activeSession) notifySessionChange(activeSession, 'Exercício trocado. Registre a primeira série.');
      return;
    }

    const next: SessionExercise = {
      id: makeId(),
      order: activeSession?.exercises.length ?? 0,
      planned: null,
      performed: toSnapshot(exercise),
      status: 'added',
      sets: [],
    };
    mutate((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id !== sessionViewId ? session : applySessionEdit(session, { type: 'add', exercise: next }),
      ),
    }));
    setActiveExerciseId(next.id);
    setComposerKg('');
    setComposerReps('10');
    setModal(null);
    if (activeSession) notifySessionChange(activeSession, 'Exercício adicionado. Registre a primeira série.');
  }

  function moveDraftExercise(index: number, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.exercises.length) return current;
      const exercises = [...current.exercises];
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...current, exercises: exercises.map((exercise, order) => ({ ...exercise, order })) };
    });
  }

  function updateDraftExercise(id: string, field: 'targetSets' | 'targetReps' | 'targetKg', value: string) {
    setDraft((current) => current ? {
      ...current,
      exercises: current.exercises.map((exercise) => {
        if (exercise.id !== id) return exercise;
        if (field === 'targetKg') return { ...exercise, targetKg: parseDecimal(value) };
        const parsed = Number(value);
        return { ...exercise, [field]: Number.isInteger(parsed) && parsed > 0 ? parsed : 1 };
      }),
    } : current);
  }

  async function handleRestore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const backup = parseBackup(JSON.parse(await file.text()));
      const planCount = backup.data.plans.length;
      const sessionCount = backup.data.sessions.length;
      if (!window.confirm(`Restaurar ${planCount} ficha(s) e ${sessionCount} sessão(ões)? Os dados atuais serão substituídos.`)) return;
      await restoreAppState(backup);
      setState(backup.data);
      setSessionViewId(null);
      notify('Backup restaurado.');
    } catch {
      notify('Arquivo inválido. Nenhum dado foi alterado.');
    }
  }

  function renderHeader() {
    return (
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><Dumbbell size={22} strokeWidth={2.7} /></div>
          <div>
            <p className="brand-title">GymSheet</p>
            <p className="brand-subtitle">Seu treino, no seu ritmo.</p>
          </div>
        </div>
        <span className={`online-pill ${catalogMeta.source}`} aria-live="polite">{sourceLabel(catalogMeta.source)}</span>
      </header>
    );
  }

  function applyServiceWorkerUpdate() {
    const waiting = serviceWorkerRegistrationRef.current?.waiting;
    if (!waiting) {
      setUpdateReady(false);
      void serviceWorkerRegistrationRef.current?.update();
      return;
    }
    reloadAfterServiceWorkerUpdateRef.current = true;
    waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  function renderUpdateBanner() {
    if (!updateReady) return null;
    return (
      <output className="update-banner" aria-live="polite">
        <div className="update-banner-copy"><strong>Nova versão disponível</strong><span>Atualize o GymSheet sem apagar seus treinos.</span></div>
        <div className="update-banner-actions"><button className="btn btn-primary btn-small" type="button" onClick={applyServiceWorkerUpdate}>Atualizar agora</button><button className="btn btn-quiet btn-small" type="button" onClick={() => setUpdateReady(false)}>Depois</button></div>
      </output>
    );
  }

  function renderWarning() {
    if (!catalogMeta.error) return null;
    const isFallback = catalogMeta.source === 'fallback';
    return (
      <output className="warning">
        <AlertTriangle size={16} />
        <div><strong>{isFallback ? 'Catálogo offline.' : 'Catálogo remoto indisponível.'}</strong>{' '}{isFallback ? 'Usando 40 compostos essenciais salvos no app.' : 'Usando a última cópia salva no aparelho.'}</div>
        <button type="button" onClick={() => void refreshCatalog()}>Tentar</button>
      </output>
    );
  }

  function renderToday() {
    const pinnedProgress = pinnedSession ? `${pinnedSession.exercises.filter((exercise) => exercise.status !== null).length}/${pinnedSession.exercises.length || 0} resolvidos` : '';
    return (
      <main className="app-main">
        <section>
          <p className="eyebrow">Hoje · {formatDate(today, { weekday: 'long' })}</p>
          <h1 className="page-title">GymSheet</h1>
          <p className="page-lede">Uma mão, uma série por vez. O que você fizer fica salvo só neste aparelho.</p>
        </section>
        {catalogMeta.error && <div style={{ marginTop: 18 }}>{renderWarning()}</div>}

        <section className="section-heading"><h2>Seu item pinado</h2><p>{state.todayPin ? 'fica aqui até você resolver' : 'nada fixado ainda'}</p></section>
        {pinnedPlan && (
          <div className="surface pin-card">
            <div className="pin-top"><span className="pin-label"><Pin size={14} /> Ficha planejada</span><span className="pin-meta">{pinnedPlan.exercises.length} exercícios</span></div>
            <h2 className="pin-name">{pinnedPlan.emoji ? `${pinnedPlan.emoji} ` : ''}{pinnedPlan.name}</h2>
            <p className="pin-detail">Pronta para registrar sem procurar de novo.</p>
            <div className="pin-actions"><button className="btn btn-primary" type="button" onClick={() => startSession(pinnedPlan)}><Play size={17} fill="currentColor" /> Começar sessão</button><button className="btn btn-quiet" type="button" onClick={clearPin}><PinOff size={16} /> Desafixar</button></div>
          </div>
        )}
        {pinnedSession && (
          <div className="surface pin-card">
            <div className="pin-top"><span className="pin-label"><Activity size={14} /> Sessão em andamento</span><span className="pin-meta">{pinnedProgress}</span></div>
            <h2 className="pin-name">{pinnedSession.sourcePlanName ?? 'Sessão vazia'}</h2>
            <p className="pin-detail">Começou {formatDateTime(pinnedSession.startedAt)}. Retome de onde parou.</p>
            <div className="pin-actions"><button className="btn btn-primary" type="button" onClick={() => startSession(pinnedSession.sourcePlanId ? state.plans.find((plan) => plan.id === pinnedSession.sourcePlanId) : undefined)}><Play size={17} fill="currentColor" /> Retomar sessão</button><button className="btn btn-quiet" type="button" onClick={() => discardSession(pinnedSession.id)}><Trash2 size={16} /> Descartar</button></div>
          </div>
        )}
        {!state.todayPin && (
          <div className="surface empty">
            <div className="empty-icon"><Pin size={24} /></div>
            <h2>O topo está livre</h2>
            <p>Fixe uma ficha para começar com intenção ou abra uma sessão vazia quando quiser improvisar.</p>
            <div className="button-stack"><button className="btn btn-primary" type="button" onClick={() => openPlanEditor()}><Plus size={18} /> Criar ficha</button><button className="btn btn-secondary" type="button" onClick={() => startSession()}><CirclePlus size={18} /> Sessão vazia</button></div>
          </div>
        )}

        {!state.todayPin && state.plans.length > 0 && (
          <section>
            <div className="section-heading"><h2>Fixar uma ficha</h2><button className="btn btn-quiet btn-small" type="button" onClick={() => { setTab('folder'); setFolderTab('plans'); }}>Ver todas <ChevronRight size={15} /></button></div>
            <div className="list">{state.plans.slice(0, 3).map((plan) => <div className="list-card" key={plan.id}><div className="list-card-main"><h3>{plan.emoji ? `${plan.emoji} ` : ''}{plan.name}</h3><p>{plan.exercises.length} exercícios · atualizado {formatDate(plan.updatedAt)}</p></div><button className="btn btn-secondary btn-small" type="button" onClick={() => pinPlan(plan.id)}><Pin size={14} /> Fixar</button></div>)}</div>
          </section>
        )}

        <section>
          <div className="section-heading"><h2>Atalhos</h2><p>sem menu escondido</p></div>
          <div className="quick-grid">
            <button className="quick-card" type="button" onClick={() => openPlanEditor()}><Plus size={20} /><div><strong>Nova ficha</strong><span>Monte seu próximo treino</span></div></button>
            <button className="quick-card" type="button" onClick={() => startSession()}><Activity size={20} /><div><strong>Treino livre</strong><span>Comece sem planejamento</span></div></button>
            <button className="quick-card" type="button" onClick={() => setTab('week')}><CalendarDays size={20} /><div><strong>Ver semana</strong><span>O que já aconteceu</span></div></button>
            <button className="quick-card" type="button" onClick={() => setTab('data')}><Database size={20} /><div><strong>Dados</strong><span>Exportar ou restaurar</span></div></button>
          </div>
        </section>

        {recentSessions.length > 0 && (
          <section>
            <div className="section-heading"><h2>Mais recente</h2><p>{recentSessions.length} registro(s)</p></div>
            <div className="list">{recentSessions.slice(0, 2).map((session) => <button className="list-card" key={session.id} type="button" onClick={() => { setTab('folder'); setFolderTab('sessions'); }}><div className="list-card-main"><h3>{session.sourcePlanName ?? 'Sessão vazia'}</h3><p>{formatDateTime(session.startedAt)} · {session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} séries</p></div><History size={17} color="var(--muted)" /></button>)}</div>
          </section>
        )}
      </main>
    );
  }

  function renderFolder() {
    return (
      <main className="app-main">
        <section><p className="eyebrow">Pasta</p><h1 className="page-title">Fichas e sessões</h1><p className="page-lede">Planeje antes. Guarde o que realmente aconteceu.</p></section>
        <div className="tabs"><button className={`tab ${folderTab === 'plans' ? 'active' : ''}`} type="button" onClick={() => setFolderTab('plans')}>Fichas ({state.plans.length})</button><button className={`tab ${folderTab === 'sessions' ? 'active' : ''}`} type="button" onClick={() => setFolderTab('sessions')}>Sessões ({state.sessions.length})</button></div>
        {folderTab === 'plans' ? (
          state.plans.length ? <div className="list">{state.plans.map((plan) => <div className="list-card" key={plan.id}><div className="list-card-main"><h3>{plan.emoji ? `${plan.emoji} ` : ''}{plan.name}</h3><p>{plan.exercises.length} exercícios · {state.todayPin?.kind === 'plan' && state.todayPin.id === plan.id ? 'pinada hoje' : `atualizada ${formatDate(plan.updatedAt)}`}</p></div><div className="list-card-actions"><button className="btn btn-secondary btn-small" type="button" onClick={() => openPlanEditor(plan)} aria-label={`Editar ${plan.name}`}>Editar</button>{state.todayPin?.kind === 'plan' && state.todayPin.id === plan.id ? <button className="btn btn-quiet btn-small" type="button" onClick={clearPin}><PinOff size={14} /></button> : <button className="btn btn-secondary btn-small" type="button" onClick={() => pinPlan(plan.id)} aria-label={`Fixar ${plan.name}`}><Pin size={14} /></button>}<button className="btn btn-danger btn-small" type="button" onClick={() => deletePlan(plan.id)} aria-label={`Excluir ${plan.name}`}><Trash2 size={14} /></button></div></div>)}</div> : <div className="surface empty"><div className="empty-icon"><FolderOpen size={24} /></div><h2>A pasta está vazia</h2><p>Crie uma ficha com seus exercícios e alvos de séries.</p><button className="btn btn-primary" type="button" onClick={() => openPlanEditor()}><Plus size={18} /> Criar primeira ficha</button></div>
        ) : (
          state.sessions.length ? <div className="list">{[...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map((session) => <div className="list-card" key={session.id}><div className="list-card-main"><h3>{session.sourcePlanName ?? 'Sessão vazia'} {session.state === 'in_progress' && <span className="status-chip added">Em andamento</span>}</h3><p>{formatDateTime(session.startedAt)} · {session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} séries</p></div>{session.state === 'in_progress' ? <button className="btn btn-primary btn-small" type="button" onClick={() => setSessionViewId(session.id)}><Play size={14} /> Retomar</button> : <CircleCheck size={20} color="var(--lime)" />}</div>)}</div> : <div className="surface empty"><div className="empty-icon"><History size={24} /></div><h2>Nenhuma sessão ainda</h2><p>Quando você registrar sua primeira série, ela aparece aqui.</p><button className="btn btn-primary" type="button" onClick={() => startSession()}><Play size={18} /> Começar sessão vazia</button></div>
        )}
      </main>
    );
  }

  function renderRankCard(title: string, items: Array<{ label: string; count: number; detail?: string }>, emptyText: string, status: ExerciseStatus) {
    return <section className="surface" style={{ padding: 17 }}><div className="section-heading" style={{ margin: 0 }}><h2>{title}</h2><StatusChip status={status} /></div>{items.length ? <div className="rank-list">{items.slice(0, 5).map((item) => <div className="rank-item" key={`${item.label}-${item.count}`}><div><strong>{item.label}</strong><span>{item.detail ?? 'ocorrência na semana'}</span></div><span className="rank-count">{item.count}×</span></div>)}</div> : <p style={{ margin: '16px 0 0', color: 'var(--muted)', fontSize: 13 }}>{emptyText}</p>}</section>;
  }

  function renderCalendar() {
    const todayKey = localDateKey(today);
    const selectedIsFuture = calendarSelectedDateKey > todayKey;
    const selectedLabel = formatDateKeyLabel(calendarSelectedDateKey, { weekday: 'long' });
    return (
      <section className="calendar-section">
        <div className="section-heading calendar-heading">
          <div><h2>Calendário</h2><p>Abra uma sessão passada para corrigir ou completar.</p></div>
          <div className="calendar-nav">
            <button className="btn btn-quiet btn-icon" type="button" onClick={() => setCalendarCursor((current) => shiftMonth(current, -1))} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => { setCalendarCursor(monthStart(today)); setCalendarSelectedDateKey(todayKey); }}>Hoje</button>
            <button className="btn btn-quiet btn-icon" type="button" onClick={() => setCalendarCursor((current) => shiftMonth(current, 1))} aria-label="Próximo mês"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="surface calendar-card">
          <div className="calendar-month-title"><strong>{monthTitle(calendarCursor)}</strong><span>• = sessão registrada</span></div>
          <div className="calendar-weekdays" aria-hidden="true">{CALENDAR_WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid" role="grid" aria-label={`Calendário de ${monthTitle(calendarCursor)}`}>
            {calendarDays.map((day) => {
              const hasCompleted = day.sessions.some((session) => session.state === 'completed');
              const hasOpen = day.sessions.some((session) => session.state === 'in_progress');
              const sessionLabel = day.sessions.length === 1 ? '1 sessão' : `${day.sessions.length} sessões`;
              return <button className={`calendar-day ${day.inCurrentMonth ? '' : 'outside'} ${day.dateKey === calendarSelectedDateKey ? 'selected' : ''} ${day.isToday ? 'today' : ''} ${hasCompleted ? 'completed' : ''} ${hasOpen ? 'in-progress' : ''}`} key={day.dateKey} type="button" disabled={day.isFuture} aria-pressed={day.dateKey === calendarSelectedDateKey} aria-label={`${formatDateKeyLabel(day.dateKey, { weekday: 'long', year: 'numeric' })}${day.sessions.length ? `, ${sessionLabel}` : ''}`} onClick={() => selectCalendarDate(day)}><span className="calendar-day-number">{day.date.getDate()}</span>{day.sessions.length > 0 && <span className="calendar-day-dot" aria-hidden="true">{day.sessions.length > 9 ? '9+' : day.sessions.length}</span>}</button>;
            })}
          </div>
        </div>
        <div className="calendar-detail">
          <div className="section-heading" style={{ marginTop: 18 }}><div><h2>{selectedLabel}</h2><p>{selectedCalendarSessions.length ? `${selectedCalendarSessions.length} ${selectedCalendarSessions.length === 1 ? 'sessão' : 'sessões'}` : 'nenhuma sessão registrada'}</p></div></div>
          {selectedCalendarSessions.length ? <div className="list">{selectedCalendarSessions.map((session) => { const plan = session.sourcePlanId ? state.plans.find((item) => item.id === session.sourcePlanId) : undefined; return <div className="list-card calendar-session-card" key={session.id}><div className="list-card-main"><h3>{plan?.emoji ? `${plan.emoji} ` : ''}{session.sourcePlanName ?? 'Sessão vazia'} {session.state === 'in_progress' ? <span className="status-chip added">Em andamento</span> : <span className="calendar-session-state">Concluída</span>}</h3><p>{formatDateTime(session.startedAt)} · {session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} séries</p></div><button className={`btn ${session.state === 'in_progress' ? 'btn-primary' : 'btn-secondary'} btn-small`} type="button" onClick={() => openSession(session.id)}>{session.state === 'in_progress' ? <><Play size={14} /> Retomar</> : <><History size={14} /> Editar</>}</button></div>; })}</div> : <div className="surface calendar-empty"><History size={22} color="var(--muted)" /><p>Nenhum registro neste dia. Crie uma sessão para lançar um treino passado.</p></div>}
          {!selectedIsFuture && <button className="btn btn-secondary calendar-add-button" type="button" onClick={() => openRetroactiveSession()}><Plus size={16} /> Adicionar sessão neste dia</button>}
          {selectedIsFuture && <p className="calendar-future-note">Datas futuras ficam bloqueadas até acontecerem.</p>}
        </div>
      </section>
    );
  }

  function renderWeek() {
    return (
      <main className="app-main">
        <section><p className="eyebrow">Semana atual</p><h1 className="page-title">O que aconteceu</h1><p className="page-lede">{weekStats.label}. Sem gráfico, só sinais úteis para o próximo treino.</p></section>
        <div className="metric-grid" style={{ marginTop: 22 }}><div className="metric"><strong>{weekStats.days}</strong><span>dias treinados</span></div><div className="metric"><strong>{weekStats.sessions}</strong><span>sessões</span></div><div className="metric"><strong>{weekStats.series}</strong><span>séries salvas</span></div></div>
        {renderCalendar()}
        <div style={{ display: 'grid', gap: 11, marginTop: 22 }}>{renderRankCard('Top skipped', weekStats.skipped, 'Nenhum exercício pulado.', 'skipped')}{renderRankCard('Top swapped', weekStats.swapped, 'Nenhum exercício trocado.', 'swapped')}{renderRankCard('Top added', weekStats.added, 'Nenhum exercício adicionado.', 'added')}</div>
        <div className="warning" style={{ marginTop: 17, borderColor: 'rgb(98 217 246 / 25%)', background: 'rgb(98 217 246 / 6%)', color: 'var(--muted)' }}><Info size={16} color="var(--blue)" /><div>Os números atualizam enquanto a sessão está em andamento. O histórico fica no aparelho.</div></div>
      </main>
    );
  }

  function renderData() {
    const lastSync = catalogMeta.savedAt ? formatDateTime(catalogMeta.savedAt) : 'ainda não sincronizado';
    return (
      <main className="app-main">
        <section><p className="eyebrow">Dados</p><h1 className="page-title">Seu histórico é seu</h1><p className="page-lede">Faça uma cópia antes de trocar de aparelho. Nada é enviado para uma conta.</p></section>
        <section className="surface data-card" style={{ marginTop: 22 }}>
          <div className="data-row"><div><strong>Catálogo de exercícios</strong><p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 11 }}>{catalogLoading ? 'sincronizando…' : sourceLabel(catalogMeta.source)}</p></div><button className="btn btn-secondary btn-small" type="button" onClick={() => void refreshCatalog()} disabled={catalogLoading}><RefreshCw size={14} className={catalogLoading ? 'spin' : undefined} /> Atualizar</button></div>
          <div className="data-row"><strong>Última cópia do catálogo</strong><span>{lastSync}</span></div>
          <div className="data-row"><strong>Fonte</strong><a className="source-link" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">Free Exercise DB ↗</a></div>
        </section>
        <section className="surface data-card" style={{ marginTop: 11 }}>
          <div className="data-row"><div><strong>CSV de séries</strong><p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 11 }}>Uma linha por série, com status</p></div><button className="btn btn-primary btn-small" type="button" onClick={() => { downloadFile(`gymsheet-${localDateKey(new Date())}.csv`, buildCsv(state.sessions), 'text/csv;charset=utf-8'); notify('CSV baixado.'); }}><FileDown size={15} /> Baixar CSV</button></div>
          <div className="data-row"><div><strong>Backup completo</strong><p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 11 }}>Fichas, sessões e pin atual</p></div><button className="btn btn-secondary btn-small" type="button" onClick={() => { downloadFile(`gymsheet-backup-${localDateKey(new Date())}.json`, JSON.stringify(createBackup(state), null, 2), 'application/json;charset=utf-8'); notify('Backup JSON baixado.'); }}><FileJson size={15} /> Baixar JSON</button></div>
          <div className="data-row"><div><strong>Restaurar backup</strong><p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 11 }}>Valida antes de substituir seus dados</p></div><label className="btn btn-secondary btn-small" htmlFor="restore-file"><Upload size={15} /> Escolher JSON</label><input id="restore-file" className="hidden-input" type="file" accept="application/json,.json" onChange={(event) => void handleRestore(event)} /></div>
        </section>
        <div className="warning" style={{ marginTop: 17 }}><Info size={16} /><div><strong>Importante:</strong> publicar o app não publica seus treinos. Para levar seus dados a outro aparelho, restaure este JSON.</div></div>
      </main>
    );
  }

  function renderSession() {
    if (!activeSession) return null;
    const resolved = activeSession.exercises.filter((exercise) => exercise.status !== null).length;
    const total = activeSession.exercises.length;
    const currentExercise = activeSession.exercises.find((exercise) => exercise.id === activeExerciseId);
    const progress = total ? Math.round((resolved / total) * 100) : 0;
    return (
      <div className="session-shell">
        <main className="session-main">
          <div className="session-header"><div><button className="btn btn-quiet btn-small" type="button" onClick={() => { setSessionViewId(null); setActiveExerciseId(null); }}><ArrowLeft size={16} /> Voltar</button><p className="eyebrow" style={{ marginTop: 17 }}>{activeSession.state === 'completed' ? 'Sessão concluída · edição' : 'Sessão em andamento'}</p><h1>{activeSession.sourcePlanName ?? 'Sessão vazia'}</h1><p>Começou {formatDateTime(activeSession.startedAt)}</p></div>{activeSession.state === 'in_progress' && <button className="btn btn-danger btn-small" type="button" onClick={() => discardSession()}><Trash2 size={14} /> Descartar</button>}</div>
          <div className="progress-track" aria-label={`${resolved} de ${total || 0} exercícios resolvidos`}><span style={{ width: `${progress}%` }} /></div><div className="session-progress-copy"><span>{resolved} de {total || 0} resolvidos</span><span>{activeSession.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} séries</span></div>
          <div className="section-heading"><h2>Exercícios</h2><button className="btn btn-secondary btn-small" type="button" onClick={() => openPicker('add')}><Plus size={15} /> Adicionar</button></div>
          {activeSession.exercises.length ? <div className="exercise-list">{activeSession.exercises.map((exercise) => {
            const display = exercise.performed ?? exercise.planned?.exercise;
            const plannedName = exercise.planned?.exercise.name;
            const isActive = activeExerciseId === exercise.id;
            return <article className={`exercise-card ${isActive ? 'active' : ''}`} key={exercise.id}><div className="exercise-top"><span className="exercise-index">{exercise.order + 1}</span><div className="exercise-copy"><h3>{display?.name ?? 'Exercício pendente'}</h3><p>{display ? `${localizeMuscle(display.primaryMuscles[0])} · ${localizeEquipment(display.equipment)}` : 'Escolha uma ação para registrar o que aconteceu.'}</p>{exercise.status && <div style={{ marginTop: 8 }}><StatusChip status={exercise.status} /></div>}</div><ExerciseImage src={display?.images[0]} alt={display?.name ?? 'exercício'} /></div>{exercise.status === 'swapped' && plannedName && <p className="swap-note">Planejado: {plannedName}</p>}{exercise.sets.length > 0 && <div className="set-list">{exercise.sets.map((set) => <div className="set-row" key={set.id}><span>Série {set.index}</span><strong>{formatKg(set.kg)} · {set.reps} reps</strong></div>)}</div>}{exercise.status === null ? <div className="exercise-controls"><button className="btn btn-primary" type="button" onClick={() => selectExerciseForRegister(exercise)}><Save size={15} /> Registrar</button>{exercise.planned && <button className="btn btn-secondary" type="button" onClick={() => markSkipped(exercise.id)}><SkipForward size={15} /> Pular</button>}{exercise.planned && <button className="btn btn-secondary" type="button" onClick={() => openPicker('swap', exercise.id)}><RotateCcw size={15} /> Trocar</button>}</div> : exercise.status === 'skipped' ? <div className="exercise-controls"><button className="btn btn-quiet" type="button" onClick={() => undoExercise(exercise.id)}><RotateCcw size={15} /> Desfazer status</button></div> : <div className="exercise-controls"><button className="btn btn-secondary" type="button" onClick={() => selectExerciseForRegister(exercise)}><Plus size={15} /> Nova série</button><button className="btn btn-quiet" type="button" onClick={() => undoExercise(exercise.id)}><RotateCcw size={15} /> Desfazer status</button></div>}</article>;
          })}</div> : <div className="surface empty"><div className="empty-icon"><ListPlus size={24} /></div><h2>Sessão livre</h2><p>Adicione seu primeiro exercício para começar a registrar.</p><button className="btn btn-primary" type="button" onClick={() => openPicker('add')}><Plus size={18} /> Adicionar exercício</button></div>}
        </main>
        <div className="session-bottom"><div className="session-bottom-inner">{currentExercise ? <div className="composer"><div className="composer-label"><span>Registrando série {currentExercise.sets.length + 1}</span><strong>{currentExercise.performed?.name ?? currentExercise.planned?.exercise.name}</strong></div><div className="input-row"><div className="input-wrap"><input id="composer-kg" className="numeric-input" inputMode="decimal" type="text" placeholder="0" value={composerKg} onChange={(event) => setComposerKg(event.target.value)} onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })} aria-label="Peso em quilogramas" /><span>kg</span></div><div className="input-wrap"><input id="composer-reps" className="numeric-input" inputMode="numeric" type="number" min="1" max="999" placeholder="10" value={composerReps} onChange={(event) => setComposerReps(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveSet(); }} onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })} aria-label="Repetições" /><span>reps</span></div><button className="btn btn-primary" type="button" onClick={saveSet}><Check size={17} strokeWidth={3} /> Salvar série</button></div></div> : activeSession.state === 'completed' ? <div className="finish-row"><span className="session-edit-note">Você está corrigindo o registro existente.</span><button className="btn btn-secondary btn-small" type="button" onClick={() => { setSessionViewId(null); setActiveExerciseId(null); }}>Voltar ao calendário</button></div> : <div className="finish-row"><button className="btn btn-primary" type="button" onClick={finishSession}><CircleCheck size={17} /> Finalizar sessão</button></div>}</div></div>
      </div>
    );
  }

  function renderPreviousSessionModal() {
    if (!pendingSessionStart) return null;
    const previous = state.sessions.find((session) => session.id === pendingSessionStart.previousSessionId);
    if (!previous) return null;
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingSessionStart(null); }}>
        <dialog open className="modal" aria-modal="true" aria-labelledby="previous-session-modal-title">
          <div className="modal-head">
            <div>
              <h2 id="previous-session-modal-title">Treino anterior ainda aberto</h2>
              <p>{previous.sourcePlanName ?? 'Sessão vazia'} começou {formatDateTime(previous.startedAt)}. Escolha antes de registrar séries hoje.</p>
            </div>
            <button className="btn btn-quiet btn-icon" type="button" onClick={() => setPendingSessionStart(null)} aria-label="Agora não"><X size={20} /></button>
          </div>
          <div className="button-stack">
            <button className="btn btn-secondary btn-block" type="button" onClick={resumePreviousSession}><History size={17} /> Retomar ontem</button>
            <button className="btn btn-primary btn-block" type="button" onClick={completePreviousAndStartToday}><Play size={17} fill="currentColor" /> Encerrar ontem e começar hoje</button>
            <button className="btn btn-quiet btn-block" type="button" onClick={() => setPendingSessionStart(null)}>Agora não</button>
          </div>
        </dialog>
      </div>
    );
  }

  function renderRetroactiveSessionModal() {
    if (!retroactiveDateKey) return null;
    const dateLabel = formatDateKeyLabel(retroactiveDateKey, { weekday: 'long' });
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRetroactiveDateKey(null); }}>
        <dialog open className="modal" aria-modal="true" aria-labelledby="retroactive-modal-title">
          <div className="modal-head">
            <div><h2 id="retroactive-modal-title">Nova sessão</h2><p>Escolha uma ficha para {dateLabel}. A sessão passada começa ao meio-dia local.</p></div>
            <button className="btn btn-quiet btn-icon" type="button" onClick={() => setRetroactiveDateKey(null)} aria-label="Fechar"><X size={20} /></button>
          </div>
          <div className="button-stack">
            <button className="btn btn-primary btn-block" type="button" onClick={() => createCalendarSession()}><CirclePlus size={17} /> Sessão vazia</button>
            {state.plans.map((plan) => <button className="btn btn-secondary btn-block" type="button" key={plan.id} onClick={() => createCalendarSession(plan)}>{plan.emoji ? `${plan.emoji} ` : ''}{plan.name}</button>)}
            <button className="btn btn-quiet btn-block" type="button" onClick={() => setRetroactiveDateKey(null)}>Agora não</button>
          </div>
        </dialog>
      </div>
    );
  }

  function renderPlanModal() {
    if (modal !== 'plan' || !draft) return null;
    return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setModal(null); setDraft(null); } }}><dialog open className="modal" aria-modal="true" aria-labelledby="plan-modal-title"><div className="modal-head"><div><h2 id="plan-modal-title">{draft.id ? 'Editar ficha' : 'Nova ficha'}</h2><p>Defina o alvo. O que acontecer fica na sessão.</p></div><button className="btn btn-quiet btn-icon" type="button" onClick={() => { setModal(null); setDraft(null); }} aria-label="Fechar"><X size={20} /></button></div><div className="editor"><div className="form-field"><label htmlFor="plan-name">Nome da ficha</label><input id="plan-name" className="text-input" type="text" placeholder="Ex.: Pernas + core" value={draft.name} onChange={(event) => setDraft((current) => current ? { ...current, name: event.target.value } : current)} /></div><div className="form-field"><label htmlFor="plan-emoji">Emoji (opcional)</label><input id="plan-emoji" className="text-input emoji-input" type="text" maxLength={8} placeholder="Ex.: 🦵" value={draft.emoji} onChange={(event) => setDraft((current) => current ? { ...current, emoji: event.target.value } : current)} /><span className="field-hint">Use um único emoji para reconhecer a ficha de relance.</span></div><div className="section-heading" style={{ margin: '5px 0 0' }}><h2>Exercícios</h2><button className="btn btn-secondary btn-small" type="button" onClick={() => openPicker('plan')}><Plus size={15} /> Adicionar</button></div>{draft.exercises.length ? <div className="list">{draft.exercises.map((exercise, index) => <div className="editor-exercise" key={exercise.id}><span>{index + 1}</span><div className="editor-exercise-name"><strong>{exercise.exercise.name}</strong><span>{localizeMuscle(exercise.exercise.primaryMuscles[0])} · {localizeEquipment(exercise.exercise.equipment)}</span></div><input className="mini-input" type="number" min="1" max="30" value={exercise.targetSets} aria-label={`Séries de ${exercise.exercise.name}`} onChange={(event) => updateDraftExercise(exercise.id, 'targetSets', event.target.value)} /><input className="mini-input" type="number" min="1" max="999" value={exercise.targetReps} aria-label={`Reps de ${exercise.exercise.name}`} onChange={(event) => updateDraftExercise(exercise.id, 'targetReps', event.target.value)} /><input className="mini-input" type="text" inputMode="decimal" placeholder="kg" value={exercise.targetKg ?? ''} aria-label={`Peso de ${exercise.exercise.name}`} onChange={(event) => updateDraftExercise(exercise.id, 'targetKg', event.target.value)} /><div style={{ display: 'grid', gap: 3 }}><button className="icon-button" type="button" onClick={() => moveDraftExercise(index, -1)} aria-label="Mover para cima" disabled={index === 0}><ArrowUp size={14} /></button><button className="icon-button" type="button" onClick={() => moveDraftExercise(index, 1)} aria-label="Mover para baixo" disabled={index === draft.exercises.length - 1}><ArrowDown size={14} /></button></div><button className="icon-button" type="button" onClick={() => setDraft((current) => current ? { ...current, exercises: current.exercises.filter((item) => item.id !== exercise.id).map((item, order) => ({ ...item, order })) } : current)} aria-label={`Remover ${exercise.exercise.name}`}><Trash2 size={14} /></button></div>)}</div> : <div className="surface empty" style={{ padding: '20px 14px' }}><ListPlus size={22} color="var(--lime)" style={{ marginBottom: 8 }} /><p style={{ margin: 0 }}>Adicione exercícios do catálogo.</p></div>}<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}><button className="btn btn-quiet" type="button" onClick={() => { setModal(null); setDraft(null); }}>Cancelar</button><button className="btn btn-primary" type="button" onClick={savePlan}><Save size={16} /> Salvar ficha</button></div></div></dialog></div>;
  }

  function renderPickerModal() {
    if (modal !== 'picker') return null;
    const title = pickerMode === 'plan' ? 'Adicionar à ficha' : pickerMode === 'swap' ? 'Trocar exercício' : 'Adicionar na sessão';
    const showingAllMatches = filteredPicker.length < pickerMatches.length;
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <dialog open className="modal" aria-modal="true" aria-labelledby="picker-modal-title">
          <div className="modal-head">
            <div>
              <h2 id="picker-modal-title">{title}</h2>
              <p>Pesquise pelo nome, músculo ou equipamento.</p>
            </div>
            <button className="btn btn-quiet btn-icon" type="button" onClick={() => setModal(null)} aria-label="Fechar"><X size={20} /></button>
          </div>
          <div className="search-row">
            <Search size={19} color="var(--muted)" style={{ margin: 14 }} />
            <input autoFocus className="text-input" type="search" placeholder="Buscar exercício" value={pickerSearch} onChange={(event) => setPickerSearch(event.target.value)} />
          </div>
          <div className="picker-filter" aria-label="Filtrar por grupo muscular">
            <div className="picker-filter-head"><span>Grupo muscular</span>{pickerMuscleGroups.length > 0 && <button className="btn btn-quiet btn-small" type="button" onClick={() => setPickerMuscleGroups([])}>Limpar</button>}</div>
            <fieldset className="muscle-chips" aria-label="Grupos musculares">
              <button className={`muscle-chip ${pickerMuscleGroups.length === 0 ? 'active' : ''}`} type="button" aria-pressed={pickerMuscleGroups.length === 0} onClick={() => setPickerMuscleGroups([])}>Todos</button>
              {pickerMuscleOptions.map((group) => <button className={`muscle-chip ${pickerMuscleGroups.includes(group.id) ? 'active' : ''}`} type="button" key={group.id} aria-pressed={pickerMuscleGroups.includes(group.id)} onClick={() => togglePickerMuscle(group.id)}>{group.label}</button>)}
            </fieldset>
          </div>
          <p className="picker-count" aria-live="polite">{pickerMatches.length} exercício{pickerMatches.length === 1 ? '' : 's'} encontrado{pickerMatches.length === 1 ? '' : 's'}{showingAllMatches ? ' · refine a busca para ver menos' : ''}</p>
          <div className="picker-list">{filteredPicker.map((exercise) => { const favorite = favoriteScores.get(exercise.id); return <button className="picker-item" type="button" key={exercise.id} onClick={() => handleCatalogPick(exercise)}><ExerciseImage src={exercise.images[0]} alt={exercise.name} /><div><strong>{exercise.name}</strong><span>{favorite ? `${favorite.count}× nos últimos 30 dias · ` : ''}{localizeMuscle(exercise.primaryMuscles[0])} · {localizeEquipment(exercise.equipment)}</span></div><ChevronRight size={17} color="var(--muted)" /></button>; })}{filteredPicker.length === 0 && <div className="empty"><Search size={24} color="var(--muted)" /><p>Nenhum exercício encontrado.</p></div>}</div>
        </dialog>
      </div>
    );
  }

  if (!ready) {
    return <main className="app-main" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><div className="surface empty" style={{ width: '100%' }}><div className="empty-icon"><Dumbbell size={24} /></div><h2>Preparando seu treino</h2><p>Carregando o catálogo e seus dados locais.</p></div></main>;
  }

  if (sessionViewId) return <>{renderSession()}{renderPlanModal()}{renderPickerModal()}{renderPreviousSessionModal()}{renderRetroactiveSessionModal()}{toast && <output className="toast" aria-live="polite">{toast}</output>}{renderUpdateBanner()}</>;

  return <div className="app-shell">{renderHeader()}{catalogLoading && <div className="app-main" style={{ paddingTop: 0 }}><p style={{ color: 'var(--muted)', fontSize: 11 }}>Sincronizando catálogo…</p></div>}{tab === 'today' && renderToday()}{tab === 'folder' && renderFolder()}{tab === 'week' && renderWeek()} {tab === 'data' && renderData()}<nav className="bottom-nav" aria-label="Navegação principal"><div className="bottom-nav-inner"><button className={`nav-item ${tab === 'today' ? 'active' : ''}`} type="button" onClick={() => setTab('today')}><Activity size={19} /><span>Hoje</span></button><button className={`nav-item ${tab === 'folder' ? 'active' : ''}`} type="button" onClick={() => setTab('folder')}><FolderOpen size={19} /><span>Pasta</span></button><button className={`nav-item ${tab === 'week' ? 'active' : ''}`} type="button" onClick={() => setTab('week')}><CalendarDays size={19} /><span>Semana</span></button><button className={`nav-item ${tab === 'data' ? 'active' : ''}`} type="button" onClick={() => setTab('data')}><Database size={19} /><span>Dados</span></button></div></nav>{renderPlanModal()}{renderPickerModal()}{renderPreviousSessionModal()}{renderRetroactiveSessionModal()}{toast && <output className="toast" aria-live="polite">{toast}</output>}{renderUpdateBanner()}</div>;
}
