import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, DUE_TYPES, LEVEL_TO_DUE_TYPE } from "../context/AppContext";
import { Card, SectionTitle } from "./ui";

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "Today", "Tomorrow", "in 3 days", "4 days overdue"… */
const relLabel = (key) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((fromKey(key) - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff} days overdue`;
  return `in ${diff} days`;
};

const fmtDay = (key) =>
  fromKey(key).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

function DueItemRow({ item, showDate, onNavigate }) {
  const {
    tasks,
    toggleDueItem,
    deleteDueItem,
    sendDueToTriage,
    toggleTask,
    setTaskDue,
  } = useApp();
  const t = DUE_TYPES[item.type] || DUE_TYPES.homework;
  const isTask = item.source === "task";
  const linked = isTask || (item.taskId && tasks.some((x) => x.id === item.taskId));
  const overdue = !item.done && item.date < toKey(new Date());

  // Task-sourced rows act on the triage task; calendar-sourced rows act on the item
  const toggle = () =>
    isTask ? toggleTask(item.taskId) : toggleDueItem(item.id);
  const remove = () =>
    isTask ? setTaskDue(item.taskId, null) : deleteDueItem(item.id);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group flex items-center gap-2.5 rounded-xl border border-line bg-black/20 px-3 py-2 transition-colors duration-200 ease-out hover:bg-white/[0.04] ${
        overdue ? "border-l-2 border-l-rose-400/70" : ""
      } ${item.done ? "opacity-50" : ""}`}
    >
      {/* Complete toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={item.done ? "Mark as not done" : "Mark as done"}
        className={`press flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors duration-200 ${
          item.done
            ? "border-emerald-400/60 bg-emerald-500 text-zinc-950"
            : "border-line-strong bg-black/30 hover:border-zinc-500"
        }`}
      >
        {item.done && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2 6.5 4.8 9 10 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Type dot + title + subject */}
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} aria-hidden />
        <span className="min-w-0">
          <span
            className={`block truncate text-sm ${
              item.done ? "text-zinc-500 line-through" : "text-zinc-100"
            }`}
          >
            {item.title}
          </span>
          {item.subject && (
            <span className="block truncate text-[10px] font-medium text-zinc-500">
              {item.subject}
            </span>
          )}
        </span>
      </span>

      {showDate && (
        <span
          className={`shrink-0 text-[11px] font-bold tabular-nums ${
            overdue ? "text-rose-300" : "text-zinc-500"
          }`}
        >
          {relLabel(item.date)}
        </span>
      )}

      {/* Type chip */}
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.pill} ${
          showDate ? "hidden sm:inline-flex" : "inline-flex"
        }`}
      >
        {t.label}
      </span>

      {/* Triage link */}
      {linked ? (
        <button
          type="button"
          onClick={() => onNavigate("triage")}
          title="Open triage"
          className="press shrink-0 cursor-pointer rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
        >
          ✓ In triage
        </button>
      ) : (
        <button
          type="button"
          onClick={() => sendDueToTriage(item.id)}
          title="Send to triage to-do list"
          className="press shrink-0 cursor-pointer rounded-md border border-line bg-zinc-800/60 px-2 py-1 text-[10px] font-bold text-zinc-300 hover:border-line-strong hover:text-zinc-100"
        >
          → Triage
        </button>
      )}

      {/* Delete / remove from calendar */}
      <button
        type="button"
        onClick={remove}
        aria-label={isTask ? `Remove ${item.title} from calendar` : `Delete ${item.title}`}
        title={isTask ? "Remove due date (task stays in triage)" : "Delete"}
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

export function DueCalendar({ onNavigate }) {
  const { dueItems, addDueItem, tasks } = useApp();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(toKey(now));
  const [date, setDate] = useState(toKey(now));
  const [type, setType] = useState("exam");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");

  const todayKeyStr = toKey(new Date());

  // Triage tasks linked to a due item are already shown as that item — skip them
  // so nothing renders twice. Unlinked tasks with a due date appear on their own.
  const linkedTaskIds = useMemo(
    () => new Set(dueItems.filter((i) => i.taskId).map((i) => i.taskId)),
    [dueItems]
  );

  const calendarItems = useMemo(() => {
    const fromDue = dueItems.map((i) => ({ ...i, source: "due" }));
    const fromTasks = tasks
      .filter((t) => t.due && !linkedTaskIds.has(t.id))
      .map((t) => ({
        id: `task-${t.id}`,
        source: "task",
        taskId: t.id,
        title: t.title,
        subject: "",
        type: LEVEL_TO_DUE_TYPE[t.level] || "homework",
        date: t.due,
        done: t.done,
      }));
    return [...fromDue, ...fromTasks];
  }, [dueItems, tasks, linkedTaskIds]);

  // Items grouped by date key for the grid
  const byDate = useMemo(() => {
    const map = {};
    for (const item of calendarItems) {
      (map[item.date] ||= []).push(item);
    }
    return map;
  }, [calendarItems]);

  // Month grid cells (Mon-first weeks, null = blank)
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const arr = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const selectedItems = (byDate[selected] || [])
    .slice()
    .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));

  const agenda = calendarItems
    .filter((i) => !i.done)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const openCount = agenda.length;

  const submit = (e) => {
    e.preventDefault();
    addDueItem({ title, subject, type, date });
    if (title.trim()) {
      setTitle("");
      setSubject("");
    }
  };

  const shiftMonth = (delta) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const goToday = () => {
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
    setSelected(toKey(n));
    setDate(toKey(n));
  };

  // Clicking a day both inspects it and pre-fills the add-form date
  const pickDay = (key) => {
    setSelected(key);
    setDate(key);
  };

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Due In"
        title="Exam & Deadline Calendar"
        right={
          <span className="rounded-full border border-line bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
            {openCount} upcoming
          </span>
        }
      />

      {/* Add form */}
      <form
        onSubmit={submit}
        className="mb-4 flex flex-col gap-2 rounded-xl border border-line bg-black/20 p-3"
      >
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="Due type"
        >
          {Object.entries(DUE_TYPES).map(([k, t]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={type === k}
              onClick={() => setType(k)}
              className={`press cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors duration-200 ease-out ${
                type === k
                  ? t.pill
                  : "border-line bg-black/25 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's due? e.g. Math test — Chapter 4"
            aria-label="Due item title"
            className="field flex-[2]"
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            aria-label="Subject"
            className="field flex-1"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Due date"
            className="field sm:w-40"
          />
          <button
            type="submit"
            className="press shrink-0 cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(99,102,241,0.7)] hover:bg-indigo-400"
          >
            Add
          </button>
        </div>
      </form>

      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="press cursor-pointer rounded-lg border border-line bg-black/25 px-2.5 py-1.5 text-sm font-bold text-zinc-300 hover:border-line-strong hover:text-zinc-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="press cursor-pointer rounded-lg border border-line bg-black/25 px-2.5 py-1.5 text-sm font-bold text-zinc-300 hover:border-line-strong hover:text-zinc-100"
          >
            ›
          </button>
        </div>
        <span className="text-sm font-bold text-zinc-100">
          {MONTHS[cursor.m]} {cursor.y}
        </span>
        <button
          type="button"
          onClick={goToday}
          className="press cursor-pointer rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-[11px] font-bold text-indigo-200 hover:bg-indigo-500/25"
        >
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Due calendar">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500"
          >
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`blank-${idx}`} />;
          const key = `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`;
          const items = byDate[key] || [];
          const isToday = key === todayKeyStr;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => pickDay(key)}
              aria-label={`${fmtDay(key)}${items.length ? `, ${items.length} due` : ""}`}
              className={`press flex min-h-12 cursor-pointer flex-col items-stretch gap-0.5 rounded-lg border p-1 text-left transition-colors duration-200 ease-out sm:min-h-16 ${
                isSelected
                  ? "border-indigo-400/60 bg-indigo-500/10"
                  : items.length
                    ? "border-line bg-black/20 hover:border-line-strong"
                    : "border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <span
                className={`flex justify-center text-[11px] font-bold ${
                  isToday ? "text-indigo-300" : "text-zinc-400"
                }`}
              >
                {isToday ? (
                  <span className="rounded-full bg-indigo-500/25 px-1.5 text-indigo-200">
                    {day}
                  </span>
                ) : (
                  day
                )}
              </span>
              {items.slice(0, 3).map((item) => {
                const t = DUE_TYPES[item.type] || DUE_TYPES.homework;
                return (
                  <span
                    key={item.id}
                    title={item.title}
                    className={`truncate rounded px-1 py-px text-[9px] font-semibold leading-tight ${t.chip} ${
                      item.done ? "opacity-40 line-through" : ""
                    }`}
                  >
                    {item.title}
                  </span>
                );
              })}
              {items.length > 3 && (
                <span className="px-1 text-[9px] font-bold text-zinc-500">
                  +{items.length - 3}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      <div className="mt-4 rounded-xl border border-line bg-black/20 p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            {fmtDay(selected)}
            <span className="ml-2 font-semibold normal-case tracking-normal text-zinc-500">
              {relLabel(selected)}
            </span>
          </h3>
          <span className="text-[11px] font-semibold tabular-nums text-zinc-500">
            {selectedItems.length} due
          </span>
        </div>
        {selectedItems.length === 0 ? (
          <p className="px-1 py-1.5 text-xs text-zinc-600">
            Nothing due that day — use the form above to add one.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {selectedItems.map((item) => (
                <DueItemRow key={item.id} item={item} onNavigate={onNavigate} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Upcoming agenda */}
      <div className="mt-4">
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          📋 Upcoming
        </h3>
        {agenda.length === 0 ? (
          <p className="px-1 py-1.5 text-xs text-zinc-600">
            Nothing due — enjoy the calm. 🎉
          </p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {agenda.map((item) => (
                <DueItemRow
                  key={item.id}
                  item={item}
                  showDate
                  onNavigate={onNavigate}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Exams 📝, deadlines ⏰ and homework 📚 live here. Click a day to add on
        that date, hit{" "}
        <span className="font-semibold text-zinc-400">→ Triage</span> to push an
        item onto your to-do list, and any triage task with a due date set
        appears here automatically.
      </p>
    </Card>
  );
}
