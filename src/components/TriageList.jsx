import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, PRIORITY_LEVELS } from "../context/AppContext";
import { Card, SectionTitle, ProgressBar } from "./ui";

const LEVEL_STYLES = {
  1: {
    header: "text-rose-300",
    chip: "bg-rose-500/15 text-rose-300 border-rose-400/25",
    row: "border-l-rose-400/70 bg-rose-500/[0.06] hover:bg-rose-500/[0.1]",
    dot: "bg-rose-400",
    bar: "from-rose-500 to-orange-400",
  },
  2: {
    header: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300 border-amber-400/25",
    row: "hover:bg-white/[0.04]",
    dot: "bg-amber-400",
    bar: "from-amber-500 to-yellow-400",
  },
  3: {
    header: "text-sky-300",
    chip: "bg-sky-500/15 text-sky-300 border-sky-400/25",
    row: "hover:bg-white/[0.04]",
    dot: "bg-sky-400",
    bar: "from-sky-500 to-cyan-400",
  },
};

const isToday = (ts) => {
  if (!ts) return false;
  const d = new Date(ts);
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
};

function AddTaskForm() {
  const { addTask } = useApp();
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(2);

  const submit = (e) => {
    e.preventDefault();
    addTask(title, level);
    setTitle("");
  };

  return (
    <form onSubmit={submit} className="mb-4 flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task to triage…"
        aria-label="New task"
        className="field flex-1"
      />
      <div
        className="flex shrink-0 items-center gap-1 rounded-lg border border-line bg-black/25 p-1"
        role="radiogroup"
        aria-label="Priority level"
      >
        {[1, 2, 3].map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={level === l}
            onClick={() => setLevel(l)}
            className={`press cursor-pointer rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors duration-200 ease-out ${
              level === l
                ? `border ${LEVEL_STYLES[l].chip}`
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            L{l}
          </button>
        ))}
      </div>
      <button
        type="submit"
        className="press cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(99,102,241,0.7)] hover:bg-indigo-400"
      >
        Triage +
      </button>
    </form>
  );
}

function TaskRow({ task }) {
  const { toggleTask, cycleLevel, deleteTask } = useApp();
  const s = LEVEL_STYLES[task.level];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group flex items-center gap-3 rounded-xl border border-line border-l-2 px-3 py-2.5 transition-colors duration-200 ease-out ${s.row} ${
        task.done ? "opacity-50" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        className={`press flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors duration-200 ${
          task.done
            ? "border-emerald-400/60 bg-emerald-500 text-zinc-950"
            : "border-line-strong bg-black/30 hover:border-zinc-500"
        }`}
      >
        <motion.svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          initial={false}
          animate={task.done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15 }}
        >
          <motion.path
            d="M2 6.5 4.8 9 10 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: task.done ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </motion.svg>
      </button>

      {/* Title */}
      <span
        className={`min-w-0 flex-1 truncate text-sm transition-colors duration-200 ${
          task.done ? "text-zinc-500 line-through" : "text-zinc-100"
        }`}
      >
        {task.title}
      </span>

      {/* Level chip — click to cycle priority */}
      <button
        type="button"
        onClick={() => cycleLevel(task.id)}
        title="Click to cycle priority"
        className={`press cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.chip}`}
      >
        {PRIORITY_LEVELS[task.level].label}
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        aria-label={`Delete ${task.title}`}
        className="press cursor-pointer rounded-md p-1 text-zinc-600 opacity-0 transition-opacity duration-200 hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.li>
  );
}

export function TriageList() {
  const { tasks, clearCompleted, crunchWeek } = useApp();

  const level1 = tasks.filter((t) => t.level === 1);
  const level1DoneToday = level1.filter((t) => t.done && isToday(t.doneAt)).length;
  const progress = level1.length ? level1DoneToday / level1.length : 0;
  const completed = tasks.filter((t) => t.done).length;

  const byLevel = (l) => tasks.filter((t) => t.level === l);

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Triage"
        title="To-Do List"
        right={
          <span className="rounded-full border border-line bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
            {completed}/{tasks.length} done
          </span>
        }
      />

      {/* Level 1 progress */}
      <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-3">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-300">
            Level 1 · completed today
          </span>
          <span className="text-xs font-bold tabular-nums text-rose-200">
            {level1DoneToday}/{level1.length}
          </span>
        </div>
        <ProgressBar value={progress} tone={LEVEL_STYLES[1].bar} />
        {level1.length === 0 && (
          <p className="mt-1.5 text-[11px] text-rose-300/60">
            No critical tasks — add one with level L1.
          </p>
        )}
      </div>

      <AddTaskForm />

      {/* Grouped by level */}
      <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto pr-1">
        {[1, 2, 3].map((l) => {
          const list = byLevel(l);
          const s = LEVEL_STYLES[l];
          return (
            <div key={l}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                <h3 className={`text-[11px] font-bold uppercase tracking-[0.14em] ${s.header}`}>
                  L{l} · {PRIORITY_LEVELS[l].label}
                </h3>
                <span className="text-[11px] font-semibold tabular-nums text-zinc-500">
                  {list.length}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              {list.length === 0 ? (
                <p className="px-1 py-2 text-xs text-zinc-600">
                  {l === 1
                    ? "Exams, major labs, deadlines that cannot slip."
                    : l === 2
                      ? "Standard homework — do it, but it can flex."
                      : "Background reading, upkeep, nice-to-haves."}
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  <AnimatePresence initial={false}>
                    {list.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {completed > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <button
            onClick={clearCompleted}
            className="press cursor-pointer text-xs font-semibold text-zinc-500 hover:text-zinc-300"
          >
            Clear {completed} completed →
          </button>
        </div>
      )}

      {crunchWeek && (
        <p className="mt-3 text-[11px] font-medium text-rose-300/80">
          🔥 Crunch mode: only the red matters this week.
        </p>
      )}
    </Card>
  );
}
