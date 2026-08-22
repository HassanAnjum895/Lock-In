import { motion } from "framer-motion";
import { useApp, DAYS, DAY_LABELS, DUE_TYPES, LEVEL_TO_DUE_TYPE } from "../context/AppContext";
import { Card, SectionTitle } from "./ui";
import { CloudSync } from "./CloudSync";

const pad = (n) => String(n).padStart(2, "0");
const relDue = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${-diff}d overdue`;
  return `in ${diff}d`;
};

const freeLabel = (minutes) => {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`;
};

function Stat({ label, value, sub, accent = "text-zinc-100" }) {
  return (
    <div className="rounded-xl border border-line bg-black/20 p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight ${accent}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{sub}</p>}
    </div>
  );
}

export function Overview({ onNavigate }) {
  const { themeSentence, schedule, tasks, techProjects, dueItems } = useApp();

  const freeMinutes = DAYS.reduce(
    (sum, d) =>
      sum +
      (schedule[d] || [])
        .filter((b) => b.free)
        .reduce((s, b) => s + Math.max(0, b.end - b.start), 0),
    0
  );
  const classCount = DAYS.reduce(
    (sum, d) => sum + (schedule[d] || []).filter((b) => !b.free).length,
    0
  );
  const openTasks = tasks.filter((t) => !t.done).length;
  const level1Open = tasks.filter((t) => !t.done && t.level === 1).length;
  const shipped = techProjects.filter((p) => p.done).length;

  // Due items + triage tasks that carry a due date (skip tasks already shown
  // through their linked calendar item)
  const linkedTaskIds = new Set(
    dueItems.filter((i) => i.taskId).map((i) => i.taskId)
  );
  const dueSoon = [
    ...dueItems,
    ...tasks
      .filter((t) => t.due && !linkedTaskIds.has(t.id))
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        type: LEVEL_TO_DUE_TYPE[t.level] || "homework",
        date: t.due,
        done: t.done,
      })),
  ];
  const upcoming = dueSoon
    .filter((i) => !i.done)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, 3);

  const daySpan = (d) => {
    const blocks = schedule[d] || [];
    if (!blocks.length) return 0;
    const ends = blocks.map((b) => b.end);
    const starts = blocks.map((b) => b.start);
    return Math.max(...ends) - Math.min(...starts);
  };
  const dayFree = (d) =>
    (schedule[d] || [])
      .filter((b) => b.free)
      .reduce((s, b) => s + Math.max(0, b.end - b.start), 0);

  return (
    <Card className="mx-auto max-w-5xl p-5">
      <SectionTitle
        eyebrow="Dashboard"
        title="Overview"
        right={
          <span
            className="max-w-56 truncate rounded-full border border-line bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-zinc-400"
            title={themeSentence}
          >
            {themeSentence.trim() ? `“${themeSentence.trim()}”` : "No theme set"}
          </span>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Classes this week"
          value={classCount}
          accent="text-indigo-300"
          sub="across Mon–Fri"
        />
        <Stat
          label="Study windows"
          value={freeLabel(freeMinutes)}
          accent="text-emerald-300"
          sub="free gaps (håltimma)"
        />
        <Stat
          label="Open tasks"
          value={openTasks}
          accent={level1Open > 0 ? "text-rose-300" : "text-zinc-100"}
          sub={`${level1Open} critical`}
        />
        <Stat
          label="Projects shipped"
          value={`${shipped}/${techProjects.length}`}
          accent="text-violet-300"
          sub="side builds"
        />
      </div>

      {/* Due soon */}
      <div className="mt-4 rounded-xl border border-line bg-black/20 p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            ⏳ Due soon
          </h3>
          <button
            onClick={() => onNavigate("due")}
            className="press cursor-pointer text-[11px] font-semibold text-zinc-500 hover:text-zinc-300"
          >
            Open calendar →
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-1 py-1 text-xs text-zinc-600">
            Nothing due — clear calendar. 🎉
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {upcoming.map((item) => {
              const t = DUE_TYPES[item.type] || DUE_TYPES.homework;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-line bg-black/20 px-2.5 py-1.5"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-zinc-500">
                    {t.label}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-bold tabular-nums ${
                      item.date < `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`
                        ? "text-rose-300"
                        : "text-zinc-400"
                    }`}
                  >
                    {relDue(item.date)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Week at a glance */}
      <div className="mt-4 rounded-xl border border-line bg-black/20 p-3.5">
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          📅 Week at a glance — free time per day
        </h3>
        <div className="flex flex-col gap-2">
          {DAYS.map((d) => {
            const span = daySpan(d);
            const free = dayFree(d);
            const pct = span ? free / span : 0;
            return (
              <div key={d} className="flex items-center gap-2.5">
                <span className="w-9 shrink-0 text-[11px] font-bold uppercase text-zinc-500">
                  {DAY_LABELS[d]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    initial={false}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <span
                  className={`w-12 shrink-0 text-right text-[11px] font-bold tabular-nums ${
                    free > 0 ? "text-emerald-300" : "text-zinc-600"
                  }`}
                >
                  {freeLabel(free)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => onNavigate("schedule")}
          className="press flex-1 cursor-pointer rounded-xl border border-line bg-black/20 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 ease-out hover:border-line-strong hover:text-zinc-100"
        >
          📅 Open Schedule
        </button>
        <button
          onClick={() => onNavigate("triage")}
          className="press flex-1 cursor-pointer rounded-xl border border-line bg-black/20 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 ease-out hover:border-line-strong hover:text-zinc-100"
        >
          ✅ Open Triage
        </button>
        <button
          onClick={() => onNavigate("due")}
          className="press flex-1 cursor-pointer rounded-xl border border-line bg-black/20 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 ease-out hover:border-line-strong hover:text-zinc-100"
        >
          📆 Open Due Calendar
        </button>
        <button
          onClick={() => onNavigate("focus")}
          className="press flex-1 cursor-pointer rounded-xl bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(99,102,241,0.7)] transition-colors duration-200 ease-out hover:bg-indigo-400"
        >
          ⏱️ Start a Focus Session
        </button>
      </div>

      {/* Cloud backup */}
      <div className="mt-4">
        <CloudSync />
      </div>
    </Card>
  );
}
