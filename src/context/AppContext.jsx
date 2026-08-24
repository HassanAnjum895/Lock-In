import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { useCloudSync } from "../hooks/useCloudSync";

export const PRIORITY_LEVELS = {
  1: { label: "Critical", color: "critical", ring: "rose" },
  2: { label: "Important", color: "important", ring: "amber" },
  3: { label: "Can Wait", color: "canwait", ring: "sky" },
};

/** Map a triage priority level back to a calendar due type (for tasks with a due date). */
export const LEVEL_TO_DUE_TYPE = { 1: "exam", 2: "deadline", 3: "homework" };

export const DUE_TYPES = {
  exam: {
    label: "Exam",
    emoji: "📝",
    level: 1, // triage priority when sent to the to-do list
    dot: "bg-rose-400",
    chip: "bg-rose-500/15 text-rose-300",
    pill: "bg-rose-500/15 text-rose-300 border-rose-400/25",
  },
  deadline: {
    label: "Deadline",
    emoji: "⏰",
    level: 2,
    dot: "bg-amber-400",
    chip: "bg-amber-500/15 text-amber-300",
    pill: "bg-amber-500/15 text-amber-300 border-amber-400/25",
  },
  homework: {
    label: "Homework",
    emoji: "📚",
    level: 3,
    dot: "bg-sky-400",
    chip: "bg-sky-500/15 text-sky-300",
    pill: "bg-sky-500/15 text-sky-300 border-sky-400/25",
  },
};

export const PRESETS = {
  hp: { label: "Deep Focus", minutes: 55, emoji: "⚡" },
  pomodoro: { label: "Pomodoro", minutes: 25, emoji: "🍅" },
};

export const DAYS = ["mon", "tue", "wed", "thu", "fri"];
export const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
};
export const DAY_FULL = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** One flexible block: start/end are minutes since midnight (e.g. 8*60 = 08:00). */
const block = (start, end, extra = {}) => ({
  id: uid(),
  start,
  end,
  label: "",
  free: false,
  ...extra,
});

/** Default school frame: hourly 08:00 → 16:00, like the original app. */
const defaultDay = () =>
  [8, 9, 10, 11, 12, 13, 14, 15].map((h) => block(h * 60, (h + 1) * 60));

const defaultSchedule = () => ({
  mon: defaultDay(),
  tue: defaultDay(),
  wed: defaultDay(),
  thu: defaultDay(),
  fri: defaultDay(),
});

/** Legacy "today" schedule was an array of hourly slots — fold it onto the current weekday. */
const migrateLegacySchedule = (legacy) => {
  const next = defaultSchedule();
  const idx = Math.min(Math.max(new Date().getDay() - 1, 0), 4); // Sun→Mon, Sat→Fri
  next[DAYS[idx]] = legacy.map((s) =>
    block(s.h * 60, (s.h + 1) * 60, {
      id: s.id,
      label: s.label || "",
      free: !!s.free,
    })
  );
  return next;
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [themeSentence, setThemeSentence] = usePersistedState(
    "student-os.theme",
    ""
  );
  const [crunchWeek, setCrunchWeek] = usePersistedState(
    "student-os.crunch",
    false
  );
  const [schedule, setSchedule] = usePersistedState(
    "student-os.schedule",
    defaultSchedule
  );
  const [tasks, setTasks] = usePersistedState("student-os.tasks", []);
  const [timer, setTimer] = usePersistedState("student-os.timer", {
    secondsLeft: PRESETS.hp.minutes * 60,
    total: PRESETS.hp.minutes * 60,
    preset: "hp",
    customMinutes: PRESETS.hp.minutes,
    customSeconds: 0,
  });
  const [savings, setSavings] = usePersistedState("student-os.savings", 0);
  const [techProjects, setTechProjects] = usePersistedState(
    "student-os.projects",
    []
  );
  const [dueItems, setDueItems] = usePersistedState("student-os.due", []);

  // ---- Legacy schedule migration ----------------------------------------
  useEffect(() => {
    if (Array.isArray(schedule)) {
      setSchedule(migrateLegacySchedule(schedule));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Cloud sync (account-based, real-time) ----------------------------
  const sync = useCloudSync();
  const [hydrated, setHydrated] = useState(false);
  // Block pushes until the account's backup has been fetched for this session,
  // so a sign-in (or reload while signed in) imports cloud data before any
  // local state could overwrite it.
  const pendingHydrateRef = useRef(false);
  // JSON of the last remote backup we applied — lets us spot changes that came
  // from another device while ignoring our own echoes.
  const lastRemoteRef = useRef(null);

  const prevAuthRef = useRef(sync.isAuthenticated);
  useEffect(() => {
    if (sync.isAuthenticated && !prevAuthRef.current) {
      pendingHydrateRef.current = true;
    }
    prevAuthRef.current = sync.isAuthenticated;
  }, [sync.isAuthenticated]);

  const applyRemote = useCallback(
    (d) => {
      if (typeof d.themeSentence === "string") setThemeSentence(d.themeSentence);
      if (typeof d.crunchWeek === "boolean") setCrunchWeek(d.crunchWeek);
      if (d.schedule && typeof d.schedule === "object") setSchedule(d.schedule);
      if (Array.isArray(d.tasks)) setTasks(d.tasks);
      if (d.timer && typeof d.timer === "object") setTimer(d.timer);
      if (typeof d.savings === "number") setSavings(d.savings);
      if (Array.isArray(d.techProjects)) setTechProjects(d.techProjects);
      if (Array.isArray(d.dueItems)) setDueItems(d.dueItems);
    },
    [
      setThemeSentence,
      setCrunchWeek,
      setSchedule,
      setTasks,
      setTimer,
      setSavings,
      setTechProjects,
      setDueItems,
    ]
  );

  // Resolve sync once per session: import the account's backup when one
  // exists, otherwise treat local state as the source of truth. Afterwards,
  // apply any remote change that isn't our own echo — that's the live
  // cross-device sync.
  useEffect(() => {
    if (!sync.isAuthenticated) {
      setHydrated(true);
      return;
    }
    if (sync.loading) return; // first fetch for this session still in flight
    if (pendingHydrateRef.current) {
      pendingHydrateRef.current = false;
      if (sync.remote) {
        lastRemoteRef.current = JSON.stringify(sync.remote);
        applyRemote(sync.remote);
      }
    } else if (sync.remote) {
      const remoteJson = JSON.stringify(sync.remote);
      if (remoteJson !== lastRemoteRef.current) {
        lastRemoteRef.current = remoteJson;
        applyRemote(sync.remote);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.isAuthenticated, sync.loading, sync.remote]);

  // Debounced push of the whole app state to the account's cloud backup
  // whenever it changes.
  useEffect(() => {
    if (!hydrated || !sync.isAuthenticated) return;
    if (pendingHydrateRef.current) return; // don't clobber before import
    const data = {
      themeSentence,
      crunchWeek,
      schedule,
      tasks,
      timer,
      savings,
      techProjects,
      dueItems,
    };
    // Already in sync — includes our own echoes coming back from the cloud.
    if (sync.remote && JSON.stringify(data) === JSON.stringify(sync.remote)) {
      return;
    }
    const t = setTimeout(() => sync.save(data), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hydrated,
    sync.isAuthenticated,
    sync.remote,
    themeSentence,
    crunchWeek,
    schedule,
    tasks,
    timer,
    savings,
    techProjects,
    dueItems,
  ]);

  // ---- Triage actions -------------------------------------------------
  const addTask = (title, level, due = null) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      {
        id: uid(),
        title: trimmed,
        level,
        done: false,
        doneAt: null,
        due: due || null, // YYYY-MM-DD — shows on the Due calendar
      },
      ...prev,
    ]);
  };

  const setTaskDue = (id, due) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, due: due || null } : t))
    );

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : null }
          : t
      )
    );

  const cycleLevel = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, level: (t.level % 3) + 1 } : t))
    );

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const clearCompleted = () =>
    setTasks((prev) => prev.filter((t) => !t.done));

  // ---- Schedule actions ------------------------------------------------
  const withDay = (day, fn) =>
    setSchedule((prev) => ({
      ...prev,
      [day]: fn(prev[day] || []),
    }));

  /** Append a class block after the last block of the day (08:00 if empty). */
  const addBlock = (day) =>
    withDay(day, (blocks) => {
      const start = blocks.reduce((m, b) => Math.max(m, b.end), 0) || 8 * 60;
      return [...blocks, block(start, start + 60)];
    });

  const removeBlock = (day, id) =>
    withDay(day, (blocks) => blocks.filter((b) => b.id !== id));

  const toggleBlockFree = (day, id) =>
    withDay(day, (blocks) =>
      blocks.map((b) => (b.id === id ? { ...b, free: !b.free } : b))
    );

  const setBlockLabel = (day, id, label) =>
    withDay(day, (blocks) =>
      blocks.map((b) => (b.id === id ? { ...b, label } : b))
    );

  const setBlockTime = (day, id, start, end) =>
    withDay(day, (blocks) =>
      blocks.map((b) => (b.id === id ? { ...b, start, end } : b))
    );

  const clearSchedule = () => setSchedule(defaultSchedule());

  // ---- Due calendar actions --------------------------------------------
  const addDueItem = ({ title, subject = "", type, date }) => {
    const trimmed = title.trim();
    if (!trimmed || !date) return;
    setDueItems((prev) => [
      {
        id: uid(),
        title: trimmed,
        subject: subject.trim(),
        type,
        date, // YYYY-MM-DD
        done: false,
        taskId: null, // triage task this item was sent to
      },
      ...prev,
    ]);
  };

  const deleteDueItem = (id) =>
    setDueItems((prev) => prev.filter((i) => i.id !== id));

  const toggleDueItem = (id) =>
    setDueItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );

  /** Push a due item into the triage to-do list (priority from its type) and record the link. */
  const sendDueToTriage = (id) => {
    const item = dueItems.find((i) => i.id === id);
    if (!item) return;
    const alreadyLinked =
      item.taskId && tasks.some((t) => t.id === item.taskId);
    if (alreadyLinked) return;
    const taskId = uid();
    const level = (DUE_TYPES[item.type] || DUE_TYPES.homework).level;
    setTasks((prev) => [
      {
        id: taskId,
        title: item.title,
        level,
        done: false,
        doneAt: null,
        due: item.date, // keep the date even if the calendar item is deleted later
      },
      ...prev,
    ]);
    setDueItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, taskId } : i))
    );
  };

  // ---- Side projects actions ------------------------------------------
  const addProject = (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTechProjects((prev) => [
      { id: uid(), title: trimmed, done: false },
      ...prev,
    ]);
  };

  const toggleProject = (id) =>
    setTechProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p))
    );

  const deleteProject = (id) =>
    setTechProjects((prev) => prev.filter((p) => p.id !== id));

  // ---- Timer actions ----------------------------------------------------
  const selectPreset = (preset) =>
    setTimer({
      secondsLeft: PRESETS[preset].minutes * 60,
      total: PRESETS[preset].minutes * 60,
      preset,
      customMinutes: PRESETS[preset].minutes,
      customSeconds: 0,
    });

  const setCustomTimer = (minutes, seconds) => {
    const m = Math.max(0, Math.floor(minutes) || 0);
    const s = Math.min(59, Math.max(0, Math.floor(seconds) || 0));
    const total = Math.max(1, m * 60 + s);
    setTimer({
      secondsLeft: total,
      total,
      preset: "custom",
      customMinutes: m,
      customSeconds: s,
    });
  };

  const resetTimer = () =>
    setTimer((prev) => ({
      ...prev,
      secondsLeft: prev.total,
    }));

  const tickTimer = () =>
    setTimer((prev) => ({
      ...prev,
      secondsLeft: Math.max(0, prev.secondsLeft - 1),
    }));

  const value = useMemo(
    () => ({
      // theme
      themeSentence,
      setThemeSentence,
      crunchWeek,
      setCrunchWeek,
      // schedule
      schedule,
      addBlock,
      removeBlock,
      toggleBlockFree,
      setBlockLabel,
      setBlockTime,
      clearSchedule,
      // triage
      tasks,
      addTask,
      toggleTask,
      cycleLevel,
      deleteTask,
      setTaskDue,
      clearCompleted,
      // timer
      timer,
      selectPreset,
      setCustomTimer,
      resetTimer,
      tickTimer,
      // due calendar
      dueItems,
      addDueItem,
      deleteDueItem,
      toggleDueItem,
      sendDueToTriage,
      // side projects
      savings,
      setSavings,
      techProjects,
      addProject,
      toggleProject,
      deleteProject,
      // cloud sync
      sync: {
        enabled: sync.enabled,
        status: sync.status,
        isAuthenticated: sync.isAuthenticated,
      },
    }),
    [
      themeSentence,
      crunchWeek,
      schedule,
      tasks,
      timer,
      savings,
      techProjects,
      dueItems,
      sync.enabled,
      sync.status,
      sync.isAuthenticated,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
