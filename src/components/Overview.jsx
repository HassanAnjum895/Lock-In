import { motion } from "framer-motion";
import { useApp, DAYS, DAY_LABELS } from "../context/AppContext";
import { Card, SectionTitle } from "./ui";
import { CloudSync } from "./CloudSync";

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
  const { themeSentence, schedule, tasks, techProjects } = useApp();

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
