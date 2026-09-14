'use client';

import {
  Activity,
  CalendarDays,
  ChevronDown,
  Database,
  Dumbbell,
  FolderOpen,
  History,
  Menu,
  X,
} from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { SetRecordedAt, WorkoutTimer } from '@/app/components/workout-time';
import { formatSetLoad } from '@/lib/set-load';
import { parseSkin, setCountCopy, SKIN_OPTIONS, SKIN_STORAGE_KEY, type Skin } from '@/lib/skin';
import { applyWorkoutIntent, type WorkoutIntent } from '@/lib/persistence';
import { commitAppState, createBackup, loadAppState, parseBackup, restoreAppState, saveAppState } from '@/lib/storage';
import { FALLBACK_EXERCISES, imageUrl, loadCatalog, toSnapshot } from '@/lib/catalog';
import { filterCatalogExercises, muscleGroupsForCatalog } from '@/lib/catalog-filter';
import { calendarGrid, localNoonIso, monthStart, monthTitle, parseLocalDateKey, sessionsForDate } from '@/lib/calendar';
import { buildDemoState } from '@/lib/demo-state';
import { normalizeEmojiInput } from '@/lib/emoji';
import { computeFavoriteScores, rankCatalogExercises } from '@/lib/favorites';
import {
  applySessionEdit,
  clonePlanExercise,
  createQuickExercise,
  createQuickSessionWithStarter,
  createSessionFromPlan,
  decideSessionStart,
  localCivilDateTime,
  localCivilDateKey as localDateKey,
  suggestedSessionName,
} from '@/lib/session';
import type {
  AppState,
  BackupV2,
  CatalogExercise,
  CatalogSource,
  Plan,
  PlanExercise,
  Session,
  SessionExercise,
  SetRecord,
} from '@/lib/types';

type Tab = 'today' | 'folder' | 'week' | 'data';
type FolderTab = 'plans' | 'sessions';
type PickerMode = 'plan' | 'swap' | 'add';
type Modal = 'workout' | 'plan' | 'picker' | null;

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
  quickStartName?: string | null;
}

/** A write that did not reach disk. The same intent is replayed, never a new one. */
interface PendingWrite {
  message: string;
  retry: () => void;
}

interface MutateOptions {
  success?: string;
  onCommitted?: (state: AppState) => void;
}

const STATE_CHANNEL = 'gymsheet-state';
const WRITE_FAILURE = 'Não consegui gravar no aparelho. Nada foi perdido; tente de novo.';

let stateChannel: BroadcastChannel | null = null;

/** Lazily opened notification channel. It refreshes other tabs; it does not coordinate writes. */
function stateChannelHandle(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!stateChannel) stateChannel = new BroadcastChannel(STATE_CHANNEL);
  return stateChannel;
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

const CALENDAR_WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

function formatDate(input: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...options,
  }).format(typeof input === 'string' ? new Date(input) : input);
}

function capitalizeFirst(value: string) {
  return value ? `${value.charAt(0).toLocaleUpperCase('pt-BR')}${value.slice(1)}` : value;
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

function sessionDisplayName(session: Session) {
  if (session.sourcePlanName) return session.sourcePlanName;
  return session.sourcePlanId === null ? suggestedSessionName(new Date(session.startedAt)) : 'Sessão vazia';
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
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [pendingWrite, setPendingWrite] = useState<PendingWrite | null>(null);
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const inFlightSetsRef = useRef(0);
  const ready = loadStatus === 'ready';
  const [tab, setTab] = useState<Tab>('today');
  const [folderTab, setFolderTab] = useState<FolderTab>('plans');
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationVersion, setNavigationVersion] = useState(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const focusDestinationRef = useRef(false);
  const [startMotion, setStartMotion] = useState<'idle' | 'queued' | 'entering'>('idle');
  const [pendingStartAction, setPendingStartAction] = useState<(() => void) | null>(null);
  const [savedExerciseId, setSavedExerciseId] = useState<string | null>(null);
  const [exerciseTransitionId, setExerciseTransitionId] = useState<string | null>(null);
  const [skin, setSkin] = useState<Skin>(() => (
    typeof window === 'undefined' ? 'calor' : parseSkin(window.localStorage.getItem(SKIN_STORAGE_KEY))
  ));

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-skin', skin);
  }, [skin]);

  function applySkin(next: Skin) {
    setSkin(next);
    window.localStorage.setItem(SKIN_STORAGE_KEY, next);
  }

  useEffect(() => {
    if (!navigationVersion) return;
    const frame = requestAnimationFrame(() => shellRef.current?.querySelector<HTMLElement>('main h1')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [navigationVersion]);
  const [sessionViewId, setSessionViewId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [composerKg, setComposerKg] = useState('');
  const [composerReps, setComposerReps] = useState('');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
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

  function runStartTransition(action: () => void) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      action();
      return;
    }
    if (startMotion !== 'idle') return;
    setStartMotion('queued');
    setPendingStartAction(() => action);
  }

  function applyLoadedState(next: AppState) {
    setState(next);
    setSessionViewId(null);
    setActiveExerciseId(null);
    setPendingSessionStart(null);
    setModal(null);
    setDraft(null);
  }

  // Other tabs only need to refresh their screen; the transaction is what keeps writes exclusive.
  function announceStateChange() {
    stateChannelHandle()?.postMessage('changed');
  }

  /**
   * Single door to persistence. The domain operation runs over the freshest
   * committed state inside one transaction, React state follows the commit, and
   * a failure offers the very same operation again instead of a new one.
   */
  async function commit(
    apply: (current: AppState) => { nextState?: AppState; stale?: string },
    options: MutateOptions = {},
  ): Promise<boolean> {
    if (loadStatus !== 'ready') {
      notify('Ainda não li os dados deste aparelho.');
      return false;
    }
    try {
      const result = await commitAppState((current) => {
        const plan = apply(current);
        return { nextState: plan.nextState, outcome: plan.stale ?? null };
      });
      setState(result.state);
      setPendingWrite(null);
      announceStateChange();
      if (result.outcome) {
        // Another tab moved the target. Reconcile the screen instead of rewriting it.
        notify(result.outcome);
        return false;
      }
      options.onCommitted?.(result.state);
      if (options.success) notify(options.success);
      return true;
    } catch {
      setPendingWrite({ message: WRITE_FAILURE, retry: () => void commit(apply, options) });
      return false;
    }
  }

  function mutate(updater: (current: AppState) => AppState, options: MutateOptions = {}) {
    return commit((current) => ({ nextState: updater(current) }), options);
  }

  function runIntent(intent: WorkoutIntent, options: MutateOptions = {}) {
    return commit((current) => {
      const result = applyWorkoutIntent(current, intent);
      return { nextState: result.nextState, stale: result.status === 'stale' ? result.reason : undefined };
    }, options);
  }

  const readLocalState = useCallback(
    () => loadAppState()
      .then((stored) => {
        setState(stored);
        setPendingWrite(null);
        setLoadStatus('ready');
      })
      // An unreadable store is not an empty store: refuse to write over it.
      .catch(() => setLoadStatus('failed')),
    [],
  );

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const result = await loadCatalog();
    setCatalog(result.exercises);
    setCatalogMeta({ source: result.source, savedAt: result.savedAt, error: result.error });
    setCatalogLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    // The owner's data and the remote catalog load apart: a slow or broken
    // catalog must never delay the workout nor look like an empty device.
    void readLocalState();
    void loadCatalog()
      .then((result) => {
        if (!mounted) return;
        setCatalog(result.exercises);
        setCatalogMeta({ source: result.source, savedAt: result.savedAt, error: result.error });
        setCatalogLoading(false);
      })
      .catch(() => {
        if (mounted) setCatalogLoading(false);
      });

    const channel = stateChannelHandle();
    const onStateMessage = () => {
      void loadAppState()
        .then((next) => { if (mounted) setState(next); })
        .catch(() => undefined);
    };
    channel?.addEventListener('message', onStateMessage);

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
      channel?.removeEventListener('message', onStateMessage);
      disposeServiceWorker?.();
      serviceWorkerRegistrationRef.current = null;
      reloadAfterServiceWorkerUpdateRef.current = false;
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, [readLocalState]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!savedExerciseId) return undefined;
    const timer = window.setTimeout(() => setSavedExerciseId(null), 1200);
    return () => window.clearTimeout(timer);
  }, [savedExerciseId]);

  useEffect(() => {
    if (!exerciseTransitionId) return undefined;
    const timer = window.setTimeout(() => setExerciseTransitionId(null), 220);
    return () => window.clearTimeout(timer);
  }, [exerciseTransitionId]);

  useEffect(() => {
    if (startMotion !== 'queued' || !pendingStartAction) return undefined;
    const timer = window.setTimeout(() => {
      pendingStartAction();
      setPendingStartAction(null);
      setStartMotion('entering');
    }, 90);
    return () => window.clearTimeout(timer);
  }, [pendingStartAction, startMotion]);

  useEffect(() => {
    if (startMotion !== 'entering') return undefined;
    const timer = window.setTimeout(() => setStartMotion('idle'), 620);
    return () => window.clearTimeout(timer);
  }, [startMotion]);

  const pinnedPlan = state.todayPin?.kind === 'plan' ? state.plans.find((plan) => plan.id === state.todayPin?.id) : undefined;
  const activeSession = sessionViewId ? state.sessions.find((session) => session.id === sessionViewId) : undefined;

  const todayKey = localDateKey(new Date());
  const today = useMemo(() => parseLocalDateKey(todayKey), [todayKey]);
  const todayInProgressSession = useMemo(
    () => state.sessions.find((session) => session.state === 'in_progress' && localDateKey(session.startedAt) === todayKey),
    [state.sessions, todayKey],
  );
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

  function openWorkoutPicker() {
    setModal('workout');
  }

  function chooseWorkout(plan?: Plan) {
    setModal(null);
    void mutate((current) => ({ ...current, todayPin: plan ? { kind: 'plan', id: plan.id } : null }), {
      success: plan ? `${plan.name} escolhido para hoje.` : 'Treino livre escolhido.',
    });
  }

  function enterSession(session: Session) {
    setSessionViewId(session.id);
    if (session.state !== 'in_progress') {
      setActiveExerciseId(null);
      setComposerKg('');
      setComposerReps('');
      return;
    }
    const target = session.exercises.find((exercise) => exercise.status === null) ?? session.exercises[0];
    if (target) selectExerciseForRegister(target);
    else {
      setActiveExerciseId(null);
      setComposerKg('');
      setComposerReps('');
    }
  }

  function startQuickSession() {
    const now = new Date();
    const decision = decideSessionStart(state.sessions, now);
    if (decision.kind === 'resume-today') {
      runStartTransition(() => {
        setModal(null);
        enterSession(decision.session);
      });
      return;
    }
    if (decision.kind === 'choose-previous') {
      setPendingSessionStart({
        previousSessionId: decision.session.id,
        planId: null,
        quickStartName: null,
      });
      setModal(null);
      return;
    }

    // Identity and start instant are minted once, outside the transaction and
    // outside any React updater that the runtime may replay.
    const session = createQuickSessionWithStarter(null, now, makeId);
    runStartTransition(() => {
      void runIntent({ kind: 'start-session', session, supersedes: null }, {
        success: 'Treino começou. Registre a primeira série.',
        onCommitted: () => {
          enterSession(session);
          setModal(null);
        },
      });
    });
  }

  function addQuickExercise() {
    if (!activeSession || activeSession.sourcePlanId !== null || activeSession.state !== 'in_progress') return;
    const next = createQuickExercise(activeSession.exercises.length, makeId);
    void runIntent({ kind: 'add-exercise', sessionId: activeSession.id, exercise: next, expectedState: activeSession.state }, {
      success: 'Próximo exercício adicionado.',
      onCommitted: () => selectExerciseForRegister(next),
    });
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
    void mutate((current) => ({ ...current, todayPin: { kind: 'plan', id: planId } }), { success: 'Ficha fixada.' });
  }

  function clearPin() {
    void mutate((current) => ({ ...current, todayPin: null }), { success: 'Ficha desafixada.' });
  }

  function notifySessionChange(session: Session, currentDayMessage: string | null) {
    if (localDateKey(session.startedAt) !== localDateKey(new Date())) {
      notify(`Correção salva em ${formatDateKeyLabel(localDateKey(session.startedAt))}.`);
      return;
    }
    if (currentDayMessage) notify(currentDayMessage);
  }

  function openSession(sessionId: string) {
    const session = state.sessions.find((item) => item.id === sessionId);
    if (session) enterSession(session);
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
    const dateKey = retroactiveDateKey;
    setRetroactiveDateKey(null);
    void mutate(
      (current) => current.sessions.some((item) => item.id === session.id) ? current : ({
        ...current,
        sessions: [...current.sessions, session],
        todayPin: isToday ? { kind: 'session', id: session.id } : current.todayPin,
      }),
      {
        success: isToday ? 'Sessão criada para hoje.' : `Sessão criada em ${formatDateKeyLabel(dateKey)} para correção.`,
        onCommitted: (next) => {
          setCalendarSelectedDateKey(dateKey);
          setCalendarCursor(monthStart(parseLocalDateKey(dateKey)));
          const created = next.sessions.find((item) => item.id === session.id);
          if (created) enterSession(created);
        },
      },
    );
  }

  function startSession(plan?: Plan) {
    const selectedPlan = plan ?? pinnedPlan;
    const decision = decideSessionStart(state.sessions, new Date());
    if (decision.kind === 'resume-today') {
      runStartTransition(() => enterSession(decision.session));
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
    runStartTransition(() => {
      void runIntent({ kind: 'start-session', session, supersedes: null }, {
        success: selectedPlan ? `Sessão ${selectedPlan.name} começou.` : 'Sessão vazia começou.',
        onCommitted: () => enterSession(session),
      });
    });
  }

  function resumePreviousSession() {
    if (!pendingSessionStart) return;
    const previous = state.sessions.find((session) => session.id === pendingSessionStart.previousSessionId);
    setPendingSessionStart(null);
    if (previous) runStartTransition(() => enterSession(previous));
  }

  function completePreviousAndStartToday() {
    if (!pendingSessionStart) return;
    const selectedPlan = pendingSessionStart.planId
      ? state.plans.find((plan) => plan.id === pendingSessionStart.planId)
      : undefined;
    const quickStartName = pendingSessionStart.quickStartName;
    const isQuickStart = quickStartName !== undefined;
    const previousSessionId = pendingSessionStart.previousSessionId;
    setPendingSessionStart(null);
    const now = new Date();
    const nextSession = isQuickStart
      ? createQuickSessionWithStarter(quickStartName ?? null, now, makeId)
      : createSessionFromPlan(selectedPlan, now, makeId);
    runStartTransition(() => {
      // Closing the previous session and opening the new one is one transaction.
      void runIntent({ kind: 'start-session', session: nextSession, supersedes: previousSessionId }, {
        success: isQuickStart ? 'Treino começou hoje. Registre a primeira série.' : selectedPlan ? `Sessão ${selectedPlan.name} começou hoje.` : 'Sessão vazia começou hoje.',
        onCommitted: () => {
          enterSession(nextSession);
          setModal(null);
        },
      });
    });
  }

  function selectExerciseForRegister(exercise: SessionExercise) {
    setActiveExerciseId(exercise.id);
    setExerciseTransitionId(exercise.id);
    setEditingSetId(null);
  }

  function startEditSet(set: SetRecord) {
    if (editingSetId === set.id) {
      setEditingSetId(null);
      return;
    }
    setEditingSetId(set.id);
    setComposerKg(set.kg === null ? '' : String(set.kg).replace('.', ','));
    setComposerReps(set.reps > 0 ? String(set.reps) : '');
  }

  function saveSet() {
    if (!activeSession || !activeExerciseId) return;
    const session = activeSession;
    const exerciseId = activeExerciseId;
    // The mark carries its own identity and instant: a retry replays this same
    // mark instead of creating another one.
    const intent: WorkoutIntent = {
      kind: 'mark-set',
      sessionId: session.id,
      exerciseId,
      setId: makeId(),
      savedAt: new Date().toISOString(),
      expectedState: session.state,
    };
    setEditingSetId(null);
    inFlightSetsRef.current += 1;
    setSavingExerciseId(exerciseId);
    void runIntent(intent, {
      onCommitted: () => {
        setSavedExerciseId(exerciseId);
        notifySessionChange(session, null);
      },
    }).finally(() => {
      inFlightSetsRef.current -= 1;
      if (inFlightSetsRef.current === 0) setSavingExerciseId(null);
    });
  }

  function updateSetValues() {
    if (!activeSession || !activeExerciseId || !editingSetId) return;
    const reps = composerReps.trim() === '' ? 0 : Number(composerReps);
    if (!Number.isInteger(reps) || reps < 0 || reps > 999) {
      notify('Informe reps inteiras entre 0 e 999, ou deixe em branco.');
      return;
    }
    const kg = parseDecimal(composerKg);
    if (composerKg.trim() && kg === null) {
      notify('Informe um peso válido ou deixe em branco.');
      return;
    }
    const sessionId = activeSession.id;
    const exerciseId = activeExerciseId;
    const setId = editingSetId;
    void mutate(
      (current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id !== sessionId
            ? session
            : applySessionEdit(session, { type: 'update-set', exerciseId, setId, kg, reps }),
        ),
      }),
      {
        onCommitted: (next) => {
          setEditingSetId(null);
          const updated = next.sessions.find((session) => session.id === sessionId);
          if (updated) notifySessionChange(updated, 'Série atualizada.');
        },
      },
    );
  }

  function markSkipped(exerciseId: string) {
    const sessionId = sessionViewId;
    if (!sessionId) return;
    void mutate(
      (current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id !== sessionId ? session : applySessionEdit(session, { type: 'skip', exerciseId }),
        ),
      }),
      {
        onCommitted: (next) => {
          const skipped = next.sessions.find((session) => session.id === sessionId);
          if (!skipped) return;
          const pending = skipped.exercises.find((exercise) => exercise.status === null);
          if (pending) selectExerciseForRegister(pending);
          else enterSession(skipped);
          notifySessionChange(skipped, 'Exercício marcado como pulado.');
        },
      },
    );
  }

  function undoExercise(exerciseId: string) {
    const sessionId = sessionViewId;
    if (!sessionId) return;
    void mutate(
      (current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id !== sessionId ? session : applySessionEdit(session, { type: 'undo', exerciseId }),
        ),
      }),
      {
        onCommitted: (next) => {
          const undone = next.sessions.find((session) => session.id === sessionId);
          if (!undone) return;
          const restored = undone.exercises.find((exercise) => exercise.id === exerciseId);
          if (restored) selectExerciseForRegister(restored);
          notifySessionChange(undone, 'Status desfeito.');
        },
      },
    );
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
    const session = activeSession;
    const intent: WorkoutIntent = {
      kind: 'finish-session',
      sessionId: session.id,
      completedAt: new Date().toISOString(),
    };
    // The session only leaves the screen after the transaction closes it.
    void runIntent(intent, {
      onCommitted: () => {
        setSessionViewId(null);
        setActiveExerciseId(null);
        setTab('today');
        notifySessionChange(session, 'Sessão finalizada e salva.');
      },
    });
  }

  function discardSession(sessionId?: string) {
    const targetId = sessionId ?? activeSession?.id;
    const target = targetId ? state.sessions.find((session) => session.id === targetId) : undefined;
    if (!target || !window.confirm('Descartar esta sessão? Isso não pode ser desfeito.')) return;
    void mutate(
      (current) => ({
        ...current,
        todayPin: current.todayPin?.kind === 'session' && current.todayPin.id === target.id ? null : current.todayPin,
        sessions: current.sessions.filter((session) => session.id !== target.id),
      }),
      {
        success: 'Sessão descartada.',
        onCommitted: () => {
          if (sessionViewId === target.id) {
            setSessionViewId(null);
            setActiveExerciseId(null);
          }
        },
      },
    );
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
    setModal(null);
    setDraft(null);
    void mutate(
      // Existence is checked against the committed state, so a retry never duplicates the plan.
      (current) => {
        const known = current.plans.some((item) => item.id === plan.id);
        return {
          ...current,
          plans: known ? current.plans.map((item) => item.id === plan.id ? plan : item) : [...current.plans, plan],
        };
      },
      { success: existing ? 'Ficha atualizada.' : 'Ficha criada.' },
    );
  }

  function deletePlan(planId: string) {
    const plan = state.plans.find((item) => item.id === planId);
    if (!plan || !window.confirm(`Excluir a ficha “${plan.name}”?`)) return;
    void mutate(
      (current) => ({
        ...current,
        plans: current.plans.filter((item) => item.id !== planId),
        todayPin: current.todayPin?.kind === 'plan' && current.todayPin.id === planId ? null : current.todayPin,
      }),
      { success: 'Ficha excluída.' },
    );
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
      const sessionId = sessionViewId;
      const exerciseId = pickerSessionExerciseId;
      const performed = toSnapshot(exercise);
      setModal(null);
      void mutate(
        (current) => ({
          ...current,
          sessions: current.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : applySessionEdit(session, { type: 'swap', exerciseId, performed }),
          ),
        }),
        {
          onCommitted: (next) => {
            setActiveExerciseId(exerciseId);
            setComposerKg('');
            setComposerReps(activeSession?.sourcePlanId === null ? '' : '10');
            const updated = next.sessions.find((session) => session.id === sessionId);
            if (updated) notifySessionChange(updated, 'Exercício trocado. Registre a primeira série.');
          },
        },
      );
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
    const sessionId = sessionViewId;
    setModal(null);
    void runIntent({ kind: 'add-exercise', sessionId, exercise: next, expectedState: activeSession?.state ?? 'in_progress' }, {
      onCommitted: (committed) => {
        setActiveExerciseId(next.id);
        setComposerKg('');
        setComposerReps(activeSession?.sourcePlanId === null ? '' : '10');
        const updated = committed.sessions.find((session) => session.id === sessionId);
        if (updated) notifySessionChange(updated, 'Exercício adicionado. Registre a primeira série.');
      },
    });
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
    let backup: BackupV2;
    try {
      backup = parseBackup(JSON.parse(await file.text()));
    } catch {
      notify('Arquivo inválido. Nenhum dado foi alterado.');
      return;
    }
    const planCount = backup.data.plans.length;
    const sessionCount = backup.data.sessions.length;
    if (!window.confirm(`Restaurar ${planCount} ficha(s) e ${sessionCount} sessão(ões)? Os dados atuais serão substituídos.`)) return;
    try {
      await restoreAppState(backup);
      applyLoadedState(backup.data);
      announceStateChange();
      notify('Backup restaurado.');
    } catch {
      // A write that never reached disk is reported as a failure, not as a restore.
      notify('Não consegui gravar a restauração. Os dados atuais continuam no aparelho.');
    }
  }

  async function handleLoadDemo() {
    if (!window.confirm('Apaga fichas e sessões atuais deste aparelho e carrega o exemplo?')) return;
    try {
      const demoState = buildDemoState();
      await saveAppState(demoState);
      applyLoadedState(demoState);
      announceStateChange();
      notify('Diário de exemplo carregado.');
    } catch {
      notify('Não consegui carregar o diário de exemplo. Nenhum dado foi alterado.');
    }
  }

  function navigate(destination: Tab, subtab?: FolderTab) {
    focusDestinationRef.current = true;
    setTab(destination);
    if (subtab) setFolderTab(subtab);
    if (!menuOpen) setNavigationVersion((current) => current + 1);
    setMenuOpen(false);
  }

  function renderHeader() {
    const destinations = [
      { label: 'Treino', tab: 'today' as const, icon: Activity },
      { label: 'Fichas', tab: 'folder' as const, subtab: 'plans' as const, icon: FolderOpen },
      { label: 'Histórico', tab: 'folder' as const, subtab: 'sessions' as const, icon: History },
      { label: 'Calendário', tab: 'week' as const, icon: CalendarDays },
      { label: 'Dados e backup', tab: 'data' as const, icon: Database },
    ];
    return (
      <header className="essential-header">
        <Dialog.Root open={menuOpen} onOpenChange={(open) => {
          if (open) focusDestinationRef.current = false;
          setMenuOpen(open);
        }} onOpenChangeComplete={(open) => {
          if (!open && focusDestinationRef.current) setNavigationVersion((current) => current + 1);
        }}>
          <Dialog.Trigger className="essential-icon-button" aria-label="Abrir menu">
            <Menu size={24} aria-hidden="true" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="essential-menu-overlay" />
            <Dialog.Popup
              className="essential-menu"
              initialFocus={menuCloseRef}
              finalFocus={() => !focusDestinationRef.current}
            >
              <div className="essential-menu-heading">
                <Dialog.Title className="essential-brand">GymSheet</Dialog.Title>
                <Dialog.Close ref={menuCloseRef} className="essential-icon-button" aria-label="Fechar menu">
                  <X size={24} aria-hidden="true" />
                </Dialog.Close>
              </div>
              <fieldset className="essential-skins">
                <legend className="essential-skins-label">Aparência</legend>
                <div className="essential-skins-row">
                  {SKIN_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="essential-skin"
                      data-testid={'skin-' + option.id}
                      aria-pressed={skin === option.id}
                      onClick={() => applySkin(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <nav aria-label="Navegação principal" className="essential-menu-links">
                {destinations.map(({ label, tab: destination, subtab, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    className="essential-menu-link"
                    aria-current={tab === destination && (!subtab || folderTab === subtab) ? 'page' : undefined}
                    data-testid={destination === 'week' ? 'week-tab' : undefined}
                    onClick={() => navigate(destination, subtab)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <p className="essential-brand">GymSheet</p>
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
      <output className="essential-banner" aria-live="polite">
        <div className="essential-banner-copy"><strong>Nova versão disponível</strong><span>Atualize o GymSheet sem apagar seus treinos.</span></div>
        <div className="essential-banner-actions">
          <button className="essential-primary" type="button" onClick={applyServiceWorkerUpdate}>Atualizar agora</button>
          <button className="essential-quiet" type="button" onClick={() => setUpdateReady(false)}>Depois</button>
        </div>
      </output>
    );
  }

  function renderWarning() {
    if (!catalogMeta.error) return null;
    const isFallback = catalogMeta.source === 'fallback';
    return (
      <output className="essential-alert">
        <div><strong>{isFallback ? 'Catálogo offline.' : 'Catálogo remoto indisponível.'}</strong>{' '}{isFallback ? 'Usando 40 compostos essenciais salvos no app.' : 'Usando a última cópia salva no aparelho.'}</div>
        <button className="essential-quiet" type="button" onClick={() => void refreshCatalog()}>Tentar</button>
      </output>
    );
  }

  function renderToday() {
    const workoutName = todayInProgressSession
      ? sessionDisplayName(todayInProgressSession)
      : pinnedPlan ? (pinnedPlan.emoji ? pinnedPlan.emoji + ' ' : '') + pinnedPlan.name : 'Treino livre';
    return (
      <main className="essential-main">
        <section aria-labelledby="today-title" className="essential-workout">
          <p className="essential-date">{capitalizeFirst(formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
          <h1 id="today-title" className="essential-title" tabIndex={-1}>
            {todayInProgressSession ? workoutName : (
              <button
                type="button"
                className="essential-selector"
                aria-label={'Escolher treino: ' + workoutName}
                onClick={openWorkoutPicker}
              >
                <span>{workoutName}</span><ChevronDown size={24} aria-hidden="true" />
              </button>
            )}
          </h1>
          <button
            className="essential-start"
            type="button"
            data-testid="start-workout"
            data-starting={startMotion !== 'idle' ? 'true' : undefined}
            aria-busy={startMotion !== 'idle'}
            disabled={startMotion !== 'idle'}
            onClick={() => {
              if (todayInProgressSession) startSession();
              else if (pinnedPlan) startSession(pinnedPlan);
              else startQuickSession();
            }}
          >
            {startMotion !== 'idle' ? <><Activity size={18} aria-hidden="true" /> Preparando treino…</> : todayInProgressSession ? 'Retomar' : 'Começar'}
          </button>
        </section>
        {catalogMeta.error && <div className="essential-warning">{renderWarning()}</div>}
      </main>
    );
  }

  function renderFolder() {
    if (folderTab === 'sessions') {
      return (
        <main className="essential-page">
          <h1 className="essential-page-title" tabIndex={-1}>Histórico</h1>
          {state.sessions.length ? (
            <ul className="essential-plan-list">
              {[...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map((session) => {
                const series = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
                return (
                  <li className="essential-plan" key={session.id}>
                    <div className="essential-plan-copy">
                      <h2>{sessionDisplayName(session)}</h2>
                      <p>{formatDateTime(session.startedAt)} · {series} {series === 1 ? 'série' : 'séries'}{session.state === 'in_progress' ? ' · em andamento' : ''}</p>
                    </div>
                    {session.state === 'in_progress' && (
                      <button className="essential-secondary" type="button" onClick={() => openSession(session.id)}>Retomar</button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="essential-exercise-note">Nenhuma sessão ainda</p>
          )}
        </main>
      );
    }

    return (
      <main className="essential-page">
        <h1 className="essential-page-title" tabIndex={-1}>Fichas</h1>
        {state.plans.length ? (
          <>
            <ul className="essential-plan-list">
              {state.plans.map((plan) => {
                const pinned = state.todayPin?.kind === 'plan' && state.todayPin.id === plan.id;
                return (
                  <li className="essential-plan" key={plan.id}>
                    <div className="essential-plan-copy">
                      <h2>{plan.emoji ? `${plan.emoji} ` : ''}{plan.name}</h2>
                      <p>{plan.exercises.length} {plan.exercises.length === 1 ? 'exercício' : 'exercícios'}{pinned ? ' · em uso hoje' : ''}</p>
                    </div>
                    <div className="essential-plan-actions">
                      <button className="essential-quiet" type="button" onClick={() => openPlanEditor(plan)} aria-label={`Editar ${plan.name}`}>Editar</button>
                      {pinned
                        ? <button className="essential-quiet" type="button" onClick={clearPin} aria-label={`Desafixar ${plan.name}`}>Desafixar</button>
                        : <button className="essential-quiet" type="button" onClick={() => pinPlan(plan.id)} aria-label={`Fixar ${plan.name}`}>Fixar</button>}
                      <button className="essential-quiet" type="button" onClick={() => deletePlan(plan.id)} aria-label={`Excluir ${plan.name}`}>Excluir</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button className="essential-secondary" type="button" onClick={() => openPlanEditor()}>Nova ficha</button>
          </>
        ) : (
          <div className="essential-page-empty">
            <button className="essential-primary" type="button" onClick={() => openPlanEditor()}>Nova ficha</button>
          </div>
        )}
      </main>
    );
  }

  function renderWeek() {
    const todayKey = localDateKey(today);
    const selectedIsFuture = calendarSelectedDateKey > todayKey;
    const selectedLabel = formatDateKeyLabel(calendarSelectedDateKey, { weekday: 'long' });
    return (
      <main className="essential-page">
        <div className="essential-calendar-head">
          <h1 className="essential-page-title" tabIndex={-1}>Calendário</h1>
          <div className="essential-calendar-nav">
            <button className="essential-quiet" type="button" onClick={() => setCalendarCursor((current) => shiftMonth(current, -1))} aria-label="Mês anterior">Anterior</button>
            <button className="essential-quiet" type="button" onClick={() => { setCalendarCursor(monthStart(today)); setCalendarSelectedDateKey(todayKey); }}>Hoje</button>
            <button className="essential-quiet" type="button" onClick={() => setCalendarCursor((current) => shiftMonth(current, 1))} aria-label="Próximo mês">Próximo</button>
          </div>
        </div>
        <p className="essential-exercise-note">{monthTitle(calendarCursor)}</p>
        <div className="essential-weekdays" aria-hidden="true">{CALENDAR_WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="essential-calendar-grid" role="grid" aria-label={`Calendário de ${monthTitle(calendarCursor)}`}>
          {calendarDays.map((day) => {
            const sessionLabel = day.sessions.length === 1 ? '1 sessão' : `${day.sessions.length} sessões`;
            const classes = [
              'essential-day',
              day.inCurrentMonth ? '' : 'outside',
              day.dateKey === calendarSelectedDateKey ? 'selected' : '',
              day.isToday ? 'today' : '',
              day.sessions.length ? 'has-session' : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                className={classes}
                key={day.dateKey}
                type="button"
                disabled={day.isFuture}
                aria-pressed={day.dateKey === calendarSelectedDateKey}
                aria-label={`${formatDateKeyLabel(day.dateKey, { weekday: 'long', year: 'numeric' })}${day.sessions.length ? `, ${sessionLabel}` : ''}`}
                onClick={() => selectCalendarDate(day)}
              >
                <span>{day.date.getDate()}</span>
                {day.sessions.length > 0 && <span className="essential-day-mark" aria-hidden="true">{day.sessions.length > 9 ? '9+' : day.sessions.length}</span>}
              </button>
            );
          })}
        </div>
        <section className="essential-calendar-detail">
          <h2>{selectedLabel}</h2>
          {selectedCalendarSessions.length ? (
            <ul className="essential-plan-list">
              {selectedCalendarSessions.map((session) => {
                const plan = session.sourcePlanId ? state.plans.find((item) => item.id === session.sourcePlanId) : undefined;
                const series = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
                return (
                  <li className="essential-plan" key={session.id}>
                    <div className="essential-plan-copy">
                      <h3>{plan?.emoji ? `${plan.emoji} ` : ''}{sessionDisplayName(session)}</h3>
                      <p>{formatDateTime(session.startedAt)} · {series} {series === 1 ? 'série' : 'séries'} · {session.state === 'in_progress' ? 'em andamento' : 'Concluída'}</p>
                    </div>
                    <button className="essential-secondary" type="button" onClick={() => openSession(session.id)}>
                      {session.state === 'in_progress' ? 'Retomar' : 'Editar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="essential-exercise-note">Nenhuma sessão neste dia</p>
          )}
          {!selectedIsFuture && (
            <button className="essential-secondary" type="button" onClick={() => openRetroactiveSession()}>Adicionar sessão neste dia</button>
          )}
          {selectedIsFuture && <p className="essential-exercise-note">Datas futuras ficam bloqueadas até acontecerem.</p>}
        </section>
      </main>
    );
  }

  function renderData() {
    const lastSync = catalogMeta.savedAt ? formatDateTime(catalogMeta.savedAt) : 'ainda não sincronizado';
    return (
      <main className="essential-page">
        <h1 className="essential-page-title" tabIndex={-1}>Dados</h1>
        <section className="essential-data-block">
          <h2>Cópia</h2>
          <button className="essential-primary" type="button" onClick={() => { downloadFile(`gymsheet-backup-${localDateKey(new Date())}.json`, JSON.stringify(createBackup(state), null, 2), 'application/json;charset=utf-8'); notify('Backup JSON baixado.'); }}>Baixar JSON</button>
          <button className="essential-secondary" type="button" onClick={() => { downloadFile(`gymsheet-${localDateKey(new Date())}.csv`, buildCsv(state.sessions), 'text/csv;charset=utf-8'); notify('CSV baixado.'); }}>Baixar CSV</button>
          <label className="essential-secondary" htmlFor="restore-file">Restaurar JSON</label>
          <input id="restore-file" className="hidden-input" type="file" accept="application/json,.json" onChange={(event) => void handleRestore(event)} />
          <p className="essential-exercise-note">Restaurar substitui os dados deste aparelho.</p>
          <button className="essential-quiet" type="button" onClick={() => void handleLoadDemo()}>Carregar exemplo</button>
        </section>
        <section className="essential-data-block">
          <h2>Catálogo de exercícios</h2>
          <p className="essential-exercise-note">{catalogLoading ? 'sincronizando…' : sourceLabel(catalogMeta.source)} · {lastSync}</p>
          <button className="essential-secondary" type="button" onClick={() => void refreshCatalog()} disabled={catalogLoading}>Atualizar</button>
          <a className="essential-data-link" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">Free Exercise DB</a>
        </section>
      </main>
    );
  }

  function renderSession() {
    if (!activeSession) return null;
    const orderedExercises = activeExerciseId
      ? [...activeSession.exercises].sort((left, right) => Number(right.id === activeExerciseId) - Number(left.id === activeExerciseId))
      : activeSession.exercises;
    const sessionDate = capitalizeFirst(formatDateKeyLabel(localDateKey(activeSession.startedAt), { weekday: 'long' }));
    const isQuickSession = activeSession.sourcePlanId === null;
    const inProgress = activeSession.state === 'in_progress';
    const selectedExercise = activeExerciseId ? activeSession.exercises.find((exercise) => exercise.id === activeExerciseId) : undefined;
    const openAdd = isQuickSession ? addQuickExercise : () => openPicker('add');
    const leaveSession = () => {
      setSessionViewId(null);
      setActiveExerciseId(null);
    };

    return (
      <div className="essential-session" data-starting={startMotion !== 'idle' ? 'true' : undefined}>
        <main className="essential-session-main">
          <header className="essential-session-header">
            <button className="essential-quiet" type="button" onClick={leaveSession}>Voltar</button>
            <p className="essential-session-context">{sessionDate}</p>
            <h1 tabIndex={-1}>{sessionDisplayName(activeSession)}</h1>
            <WorkoutTimer startedAt={activeSession.startedAt} completedAt={activeSession.completedAt} state={activeSession.state} />
          </header>

          {activeSession.exercises.length === 0 ? (
            <div className="essential-session-empty">
              <button className="essential-primary" type="button" onClick={openAdd}>Adicionar exercício</button>
            </div>
          ) : (
            <>
              <ul className="essential-session-list">
                {orderedExercises.map((exercise) => {
                  const display = exercise.performed ?? exercise.planned?.exercise;
                  const plannedName = exercise.planned?.exercise.name;
                  const isActive = activeExerciseId === exercise.id;
                  const setLabel = exercise.sets.length === 1 ? '1 série' : `${exercise.sets.length} séries`;
                  const copy = setCountCopy(exercise.sets.length, exercise.planned?.targetSets);
                  return (
                    <li key={exercise.id}>
                      <article
                        className={isActive ? 'essential-exercise active' : 'essential-exercise'}
                        data-transition={isActive && exerciseTransitionId === exercise.id ? 'true' : undefined}
                      >
                        <button
                          className="essential-exercise-select"
                          type="button"
                          aria-expanded={isActive}
                          aria-label={`${display?.name ?? 'Exercício pendente'}, ${copy.accessibleName}${exercise.status === 'skipped' ? ', pulado' : ''}`}
                          onClick={() => selectExerciseForRegister(exercise)}
                        >
                          <span className="essential-exercise-index">{exercise.order + 1}</span>
                          <span className="essential-exercise-name">{display?.name ?? 'Exercício pendente'}</span>
                          {!isActive && <span className="essential-exercise-meta">{exercise.status === 'skipped' ? 'pulado' : setLabel}</span>}
                        </button>
                        {isActive && exercise.status === 'swapped' && plannedName && plannedName !== display?.name && (
                          <p className="essential-exercise-note">Planejado: {plannedName}</p>
                        )}
                        {isActive && exercise.planned && (
                          <p className="essential-exercise-note">
                            Alvo {exercise.planned.targetSets}×{exercise.planned.targetReps}
                            {exercise.planned.targetKg != null ? ` · ${exercise.planned.targetKg.toLocaleString('pt-BR')} kg` : ''}
                          </p>
                        )}
                        {isActive && (
                          <>
                            <p className="essential-set-count" data-testid="set-count">{copy.count}</p>
                            <p className="essential-set-count-label" data-testid="set-count-label">{copy.label}</p>
                            {exercise.sets.length > 0 && (
                              <ul className="essential-set-list">
                                {exercise.sets.map((set, index) => {
                                  const load = formatSetLoad(set.kg, set.reps);
                                  return (
                                    <li key={set.id}>
                                      <button
                                        className="essential-set-row"
                                        type="button"
                                        data-arriving={savedExerciseId === exercise.id && index === exercise.sets.length - 1 ? 'true' : undefined}
                                        data-testid={'set-row-' + set.index}
                                        aria-expanded={editingSetId === set.id}
                                        aria-label={load ? `Série ${set.index}, ${load}` : `Série ${set.index}`}
                                        onClick={() => startEditSet(set)}
                                      >
                                        <span className="essential-set-label">
                                          <span>Série {set.index}</span>
                                          <SetRecordedAt savedAt={set.savedAt} sessionStartedAt={activeSession.startedAt} />
                                        </span>
                                        {load ? <strong>{load}</strong> : null}
                                      </button>
                                      {editingSetId === set.id && (
                                        <div className="essential-composer">
                                          <div className="essential-composer-row">
                                            <label className="essential-input-wrap">
                                              <input
                                                id="composer-kg"
                                                className="essential-input"
                                                inputMode="decimal"
                                                type="text"
                                                placeholder="kg"
                                                value={composerKg}
                                                onChange={(event) => setComposerKg(event.target.value)}
                                                aria-label="Peso em quilogramas"
                                              />
                                              <span>kg</span>
                                            </label>
                                            <label className="essential-input-wrap">
                                              <input
                                                id="composer-reps"
                                                className="essential-input"
                                                inputMode="numeric"
                                                type="number"
                                                min={0}
                                                max={999}
                                                placeholder="reps"
                                                value={composerReps}
                                                onChange={(event) => setComposerReps(event.target.value)}
                                                onKeyDown={(event) => { if (event.key === 'Enter') updateSetValues(); }}
                                                aria-label="Repetições"
                                              />
                                              <span>reps</span>
                                            </label>
                                          </div>
                                          <button className="essential-primary" type="button" data-testid="save-set-values" onClick={updateSetValues}>Guardar</button>
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            {exercise.status !== 'skipped' && (
                              <div className="essential-quick-register">
                                <button
                                  className="essential-primary"
                                  type="button"
                                  data-testid="quick-mark-set"
                                  data-saving={savingExerciseId === exercise.id ? 'true' : undefined}
                                  aria-busy={savingExerciseId === exercise.id}
                                  onClick={saveSet}
                                >
                                  Marcar série
                                </button>
                                <output className="essential-save-feedback" data-testid="set-save-status" aria-live="polite">
                                  {savingExerciseId === exercise.id ? 'Salvando' : savedExerciseId === exercise.id ? 'Série salva' : ''}
                                </output>
                              </div>
                            )}
                            {!isQuickSession && <details className="essential-actions-disclosure">
                              <summary>Ações do exercício</summary>
                              <div className="essential-exercise-actions">
                                {exercise.status === null && exercise.planned && (
                                  <>
                                    <button className="essential-secondary" type="button" onClick={() => markSkipped(exercise.id)}>Pular</button>
                                    <button className="essential-secondary" type="button" onClick={() => openPicker('swap', exercise.id)}>Trocar</button>
                                  </>
                                )}
                                {exercise.status !== null && (
                                  <button className="essential-quiet" type="button" onClick={() => undoExercise(exercise.id)}>Desfazer</button>
                                )}
                              </div>
                            </details>}
                          </>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
              {inProgress && (!isQuickSession || (selectedExercise?.sets.length ?? 0) > 0) && <button className="essential-secondary essential-add-exercise" data-testid={isQuickSession ? 'next-exercise' : 'add-exercise'} type="button" onClick={openAdd}>{isQuickSession ? 'Próximo exercício' : 'Adicionar exercício'}</button>}
            </>
          )}

          {inProgress ? (
            <div className="essential-session-footer">
              <button
                className="essential-secondary"
                type="button"
                data-testid="finish-workout"
                onClick={finishSession}
              >
                Finalizar
              </button>
              <details className="essential-actions-disclosure essential-session-actions">
                <summary>Ações da sessão</summary>
                <button className="essential-quiet" type="button" onClick={() => discardSession()}>Descartar</button>
              </details>
            </div>
          ) : (
            <div className="essential-session-footer">
              <p className="essential-exercise-note">Correção do registro deste dia.</p>
              <button className="essential-secondary" type="button" onClick={leaveSession}>Voltar ao calendário</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  function renderPreviousSessionModal() {
    if (!pendingSessionStart) return null;
    const previous = state.sessions.find((session) => session.id === pendingSessionStart.previousSessionId);
    if (!previous) return null;
    const previousDate = formatDateKeyLabel(localDateKey(previous.startedAt), { weekday: 'long' });
    return (
      <div className="essential-sheet-backdrop" role="presentation">
        <dialog open className="essential-sheet" aria-modal="true" aria-labelledby="previous-session-modal-title">
          <div className="essential-sheet-head">
            <h2 id="previous-session-modal-title">Treino anterior ainda aberto</h2>
          </div>
          <div className="essential-sheet-body">
            <p className="essential-exercise-note">{sessionDisplayName(previous)} · {previousDate} · começou {formatDateTime(previous.startedAt)}. Escolha como continuar.</p>
            <button className="essential-primary" type="button" onClick={resumePreviousSession}>Continuar treino de {previousDate}</button>
            <button className="essential-secondary" type="button" onClick={completePreviousAndStartToday}>Encerrar treino de {previousDate} e começar hoje</button>
            <button className="essential-quiet" type="button" onClick={() => setPendingSessionStart(null)}>Agora não</button>
          </div>
        </dialog>
      </div>
    );
  }

  function renderWorkoutPickerModal() {
    if (modal !== 'workout') return null;
    return (
      <div className="essential-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <dialog open className="essential-sheet essential-workout-picker" aria-modal="true" aria-labelledby="workout-picker-title">
          <div className="essential-sheet-head">
            <h2 id="workout-picker-title">Escolher treino</h2>
            <button autoFocus className="essential-quiet" type="button" onClick={() => setModal(null)} aria-label="Fechar">Fechar</button>
          </div>
          <div className="essential-sheet-body">
            <p className="essential-exercise-note">Escolha agora. A sessão só começa ao tocar em Começar.</p>
            <button className="essential-primary essential-workout-choice" type="button" onClick={() => chooseWorkout()}>
              <span>Treino livre</span>
              <span className="essential-choice-note">Escolha os exercícios durante o treino</span>
            </button>
            {state.plans.map((plan) => (
              <button className="essential-secondary essential-workout-choice" type="button" key={plan.id} onClick={() => chooseWorkout(plan)}>
                <span>{plan.emoji ? `${plan.emoji} ` : ''}{plan.name}</span>
                <span className="essential-choice-note">{plan.exercises.length} {plan.exercises.length === 1 ? 'exercício' : 'exercícios'}</span>
              </button>
            ))}
            <button className="essential-quiet" type="button" onClick={() => { setModal(null); navigate('folder', 'plans'); }}>Gerenciar fichas</button>
          </div>
        </dialog>
      </div>
    );
  }

  function renderRetroactiveSessionModal() {
    if (!retroactiveDateKey) return null;
    const dateLabel = formatDateKeyLabel(retroactiveDateKey, { weekday: 'long' });
    return (
      <div className="essential-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRetroactiveDateKey(null); }}>
        <dialog open className="essential-sheet" aria-modal="true" aria-labelledby="retroactive-modal-title">
          <div className="essential-sheet-head">
            <h2 id="retroactive-modal-title">Nova sessão</h2>
            <button className="essential-quiet" type="button" onClick={() => setRetroactiveDateKey(null)} aria-label="Fechar">Fechar</button>
          </div>
          <div className="essential-sheet-body">
            <p className="essential-exercise-note">{dateLabel}</p>
            <button className="essential-primary" type="button" onClick={() => createCalendarSession()}>Sessão vazia</button>
            {state.plans.map((plan) => (
              <button className="essential-secondary" type="button" key={plan.id} onClick={() => createCalendarSession(plan)}>
                {plan.emoji ? `${plan.emoji} ` : ''}{plan.name}
              </button>
            ))}
            <button className="essential-quiet" type="button" onClick={() => setRetroactiveDateKey(null)}>Agora não</button>
          </div>
        </dialog>
      </div>
    );
  }

  function renderPlanModal() {
    if (modal !== 'plan' || !draft) return null;
    const closeEditor = () => {
      setModal(null);
      setDraft(null);
    };
    return (
      <div className="essential-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
        <dialog open className="essential-sheet" aria-modal="true" aria-labelledby="plan-modal-title">
          <div className="essential-sheet-head">
            <h2 id="plan-modal-title">{draft.id ? 'Editar ficha' : 'Nova ficha'}</h2>
            <button className="essential-quiet" type="button" onClick={closeEditor} aria-label="Fechar">Fechar</button>
          </div>
          <div className="essential-sheet-body">
            <label className="essential-field" htmlFor="plan-name">Nome da ficha
              <input id="plan-name" className="essential-input" type="text" value={draft.name} onChange={(event) => setDraft((current) => current ? { ...current, name: event.target.value } : current)} />
            </label>
            <label className="essential-field" htmlFor="plan-emoji">Emoji (opcional)
              <input id="plan-emoji" className="essential-input" type="text" maxLength={8} value={draft.emoji} onChange={(event) => setDraft((current) => current ? { ...current, emoji: event.target.value } : current)} />
            </label>
            <div className="essential-sheet-row">
              <h3>Exercícios</h3>
              <button className="essential-secondary" type="button" onClick={() => openPicker('plan')}>Adicionar</button>
            </div>
            {draft.exercises.length ? (
              <ul className="essential-editor-list">
                {draft.exercises.map((exercise, index) => (
                  <li className="essential-editor-item" key={exercise.id}>
                    <p className="essential-editor-name"><strong>{index + 1}. {exercise.exercise.name}</strong><span>{localizeMuscle(exercise.exercise.primaryMuscles[0])} · {localizeEquipment(exercise.exercise.equipment)}</span></p>
                    <div className="essential-editor-targets">
                      <label>Séries<input className="essential-input" type="number" min={1} max={30} value={exercise.targetSets} aria-label={`Séries de ${exercise.exercise.name}`} onChange={(event) => updateDraftExercise(exercise.id, 'targetSets', event.target.value)} /></label>
                      <label>Reps<input className="essential-input" type="number" min={1} max={999} value={exercise.targetReps} aria-label={`Reps de ${exercise.exercise.name}`} onChange={(event) => updateDraftExercise(exercise.id, 'targetReps', event.target.value)} /></label>
                      <label>kg<input className="essential-input" type="text" inputMode="decimal" value={exercise.targetKg ?? ''} aria-label={`Peso de ${exercise.exercise.name}`} onChange={(event) => updateDraftExercise(exercise.id, 'targetKg', event.target.value)} /></label>
                    </div>
                    <div className="essential-plan-actions">
                      <button className="essential-quiet" type="button" onClick={() => moveDraftExercise(index, -1)} aria-label={`Mover ${exercise.exercise.name} para cima`} disabled={index === 0}>Subir</button>
                      <button className="essential-quiet" type="button" onClick={() => moveDraftExercise(index, 1)} aria-label={`Mover ${exercise.exercise.name} para baixo`} disabled={index === draft.exercises.length - 1}>Descer</button>
                      <button className="essential-quiet" type="button" onClick={() => setDraft((current) => current ? { ...current, exercises: current.exercises.filter((item) => item.id !== exercise.id).map((item, order) => ({ ...item, order })) } : current)} aria-label={`Remover ${exercise.exercise.name}`}>Remover</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="essential-exercise-note">Adicione um exercício do catálogo.</p>
            )}
            <div className="essential-sheet-footer">
              <button className="essential-primary" type="button" onClick={savePlan}>Salvar ficha</button>
              <button className="essential-quiet" type="button" onClick={closeEditor}>Cancelar</button>
            </div>
          </div>
        </dialog>
      </div>
    );
  }

  function renderPickerModal() {
    if (modal !== 'picker') return null;
    const title = pickerMode === 'plan' ? 'Adicionar à ficha' : pickerMode === 'swap' ? 'Trocar exercício' : 'Adicionar na sessão';
    return (
      <div className="essential-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <dialog open className="essential-sheet" data-starting={startMotion !== 'idle' ? 'true' : undefined} aria-modal="true" aria-labelledby="picker-modal-title">
          <div className="essential-sheet-head">
            <h2 id="picker-modal-title">{title}</h2>
            <button className="essential-quiet" type="button" onClick={() => setModal(null)} aria-label="Fechar">Fechar</button>
          </div>
          <div className="essential-sheet-body">
            <label className="essential-field" htmlFor="picker-search">Buscar
              <input id="picker-search" autoFocus className="essential-input" type="search" value={pickerSearch} onChange={(event) => setPickerSearch(event.target.value)} />
            </label>
            <fieldset className="essential-chips" aria-label="Grupos musculares">
              <button className={pickerMuscleGroups.length === 0 ? 'essential-chip active' : 'essential-chip'} type="button" aria-pressed={pickerMuscleGroups.length === 0} onClick={() => setPickerMuscleGroups([])}>Todos</button>
              {pickerMuscleOptions.map((group) => (
                <button className={pickerMuscleGroups.includes(group.id) ? 'essential-chip active' : 'essential-chip'} type="button" key={group.id} aria-pressed={pickerMuscleGroups.includes(group.id)} onClick={() => togglePickerMuscle(group.id)}>{group.label}</button>
              ))}
            </fieldset>
            <p className="essential-exercise-note" aria-live="polite">{pickerMatches.length} {pickerMatches.length === 1 ? 'exercício' : 'exercícios'}</p>
            <div className="essential-picker-list">
              {filteredPicker.map((exercise) => (
                <button className="essential-picker-item picker-item" type="button" key={exercise.id} onClick={() => handleCatalogPick(exercise)}>
                  <ExerciseImage src={exercise.images[0]} alt={exercise.name} />
                  <span><strong>{exercise.name}</strong><span>{localizeMuscle(exercise.primaryMuscles[0])} · {localizeEquipment(exercise.equipment)}</span></span>
                </button>
              ))}
              {filteredPicker.length === 0 && <p className="essential-exercise-note">Nenhum exercício encontrado.</p>}
            </div>
          </div>
        </dialog>
      </div>
    );
  }

  function renderPendingWrite() {
    if (!pendingWrite) return null;
    return (
      <div className="essential-retry" role="alert" data-testid="write-error">
        <span>{pendingWrite.message}</span>
        <button className="essential-secondary" type="button" data-testid="retry-write" onClick={pendingWrite.retry}>Tentar de novo</button>
      </div>
    );
  }

  if (loadStatus === 'failed') {
    // An unreadable store is never presented as a first use, and nothing is written over it.
    return (
      <main className="essential-page essential-loading" data-testid="load-error">
        <h1 className="essential-page-title">GymSheet</h1>
        <p className="essential-exercise-note">Não consegui ler os dados deste aparelho. Nada foi apagado e nada será gravado até a leitura funcionar.</p>
        <button className="essential-primary" type="button" data-testid="retry-load" onClick={() => { setLoadStatus('loading'); void readLocalState(); }}>Tentar de novo</button>
      </main>
    );
  }

  if (!ready) {
    return <main className="essential-page essential-loading"><h1 className="essential-page-title">GymSheet</h1><p className="essential-exercise-note">Carregando os dados locais.</p></main>;
  }

  if (sessionViewId) return <>{renderSession()}{renderWorkoutPickerModal()}{renderPlanModal()}{renderPickerModal()}{renderPreviousSessionModal()}{renderRetroactiveSessionModal()}{renderPendingWrite()}{toast && <output className="essential-toast" aria-live="polite">{toast}</output>}{renderUpdateBanner()}</>;

  return <div ref={shellRef} className="app-shell essential-shell essential-home">{renderHeader()}{tab === 'today' && renderToday()}{tab === 'folder' && renderFolder()}{tab === 'week' && renderWeek()}{tab === 'data' && renderData()}{renderWorkoutPickerModal()}{renderPlanModal()}{renderPickerModal()}{renderPreviousSessionModal()}{renderRetroactiveSessionModal()}{renderPendingWrite()}{toast && <output className="essential-toast" aria-live="polite">{toast}</output>}{renderUpdateBanner()}</div>;
}
