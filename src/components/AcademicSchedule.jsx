import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, DAYS, DAY_LABELS, DAY_FULL } from "../context/AppContext";
import { Card, SectionTitle } from "./ui";

/** minutes since midnight → "HH:MM" (24-hour / military time) */
const fmt = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/**
 * A text field that always displays 24-hour "HH:MM" (e.g. 13:00, 08:30),
 * independent of the browser locale. Type digits ("830" → 08:30); clamps on blur.
 */
function TimeField({ value, onChange, ariaLabel }) {
  const [draft, setDraft] = useState(fmt(value));
  const [focused, setFocused] = useState(false);

  // Re-sync the draft from the block value whenever it changes outside this field
  useEffect(() => {
    if (!focused) setDraft(fmt(value));
  }, [value, focused]);

  const commit = () => {
    const digits = draft.replace(/\D/g, "").slice(0, 4).padEnd(4, "0");
    const h = Math.min(23, parseInt(digits.slice(0, 2) || "0", 10));
    const m = Math.min(59, parseInt(digits.slice(2) || "0", 10));
    onChange(h * 60 + m);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={focused ? draft : fmt(value)}
      aria-label={ariaLabel}
      title="24-hour time, e.g. 13:00"
      onFocus={() => {
        setFocused(true);
        setDraft(fmt(value));
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
        setDraft(
          digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`
        );
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="w-[4.6rem] cursor-text rounded-md border border-transparent bg-transparent px-1 py-0.5 text-center text-xs font-bold tabular-nums text-zinc-300 transition-colors duration-200 hover:border-line focus:border-indigo-400/60 focus:bg-black/30 focus:outline-none"
    />
  );
}

const freeLabel = (minutes) => {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`;
};

export function AcademicSchedule() {
  const {
    schedule,
    addBlock,
    removeBlock,
    toggleBlockFree,
    setBlockLabel,
    setBlockTime,
    clearSchedule,
  } = useApp();

  // Start on today's weekday (Sat/Sun → Friday)
  const [day, setDay] = useState(
    () => DAYS[Math.min(Math.max(new Date().getDay() - 1, 0), 4)]
  );

  const blocks = [...(schedule[day] || [])].sort((a, b) => a.start - b.start);
  const freeMinutes = blocks
    .filter((b) => b.free)
    .reduce((s, b) => s + Math.max(0, b.end - b.start), 0);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Academic Core"
        title="Weekly Schedule"
        right={
          <button
            onClick={clearSchedule}
            className="press cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          >
            Reset week
          </button>
        }
      />

      {/* Day tabs */}
      <div
        className="mb-3 flex gap-1.5"
        role="tablist"
        aria-label="School day"
      >
        {DAYS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={day === k}
            onClick={() => setDay(k)}
            className={`press flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors duration-200 ease-out ${
              day === k
                ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-200"
                : "border-line bg-black/20 text-zinc-500 hover:border-line-strong hover:text-zinc-300"
            }`}
          >
            {DAY_LABELS[k]}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            freeMinutes > 0
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {freeLabel(freeMinutes)} spent — study windows
        </span>
        <span className="hidden items-center gap-1.5 text-zinc-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" /> free gap
          (håltimma)
        </span>
        <span className="hidden items-center gap-1.5 text-zinc-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-zinc-600" /> class
        </span>
      </div>

      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-3 py-3 text-xs text-zinc-600">
          No classes on {DAY_FULL[day]} — add one below.
        </p>
      )}

      <ol className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {blocks.map((b) => {
            const isNow = b.start <= nowMin && nowMin < b.end;
            const dur = b.end - b.start;
            return (
              <motion.li
                key={b.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div
                  className={`group flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors duration-200 ease-out ${
                    b.free
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-line bg-black/20 hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Start – end */}
                  <div
                    className={`flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums ${
                      isNow ? "text-indigo-300" : "text-zinc-400"
                    }`}
                  >
                    {isNow && (
                      <motion.span
                        animate={{ scale: [1, 1.35, 1] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                      />
                    )}
                    <TimeField
                      value={b.start}
                      ariaLabel="Start time"
                      onChange={(start) =>
                        setBlockTime(day, b.id, start, b.end)
                      }
                    />
                    <span className="text-zinc-600">–</span>
                    <TimeField
                      value={b.end}
                      ariaLabel="End time"
                      onChange={(end) =>
                        setBlockTime(day, b.id, b.start, end)
                      }
                    />
                    {dur > 0 && (
                      <span className="hidden w-9 shrink-0 text-right text-[10px] font-semibold text-zinc-500 sm:block">
                        {dur} min
                      </span>
                    )}
                  </div>

                  {/* Label / free state */}
                  {b.free ? (
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-emerald-300">
                      Håltimma — free
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={b.label}
                      placeholder="Subject"
                      aria-label="Subject"
                      onChange={(e) => setBlockLabel(day, b.id, e.target.value)}
                      className="field min-w-0 flex-1 py-1! text-xs"
                    />
                  )}

                  {/* Free toggle */}
                  <button
                    type="button"
                    onClick={() => toggleBlockFree(day, b.id)}
                    aria-pressed={b.free}
                    aria-label={
                      b.free ? "Mark as class" : "Mark as free gap"
                    }
                    title={b.free ? "Mark as class" : "Mark as free gap"}
                    className={`press flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[10px] font-bold transition-colors duration-200 ${
                      b.free
                        ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
                        : "border-line text-transparent group-hover:border-emerald-400/30 group-hover:text-emerald-400/70"
                    }`}
                  >
                    ✓
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeBlock(day, b.id)}
                    aria-label={`Delete ${b.label || "block"}`}
                    className="press cursor-pointer rounded-md p-1 text-zinc-600 transition-colors duration-200 hover:bg-rose-500/10 hover:text-rose-300"
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
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {/* Add block */}
      <button
        type="button"
        onClick={() => addBlock(day)}
        className="press mt-2 w-full cursor-pointer rounded-xl border border-dashed border-line px-3 py-2 text-xs font-semibold text-zinc-500 transition-colors duration-200 hover:border-indigo-400/40 hover:text-zinc-300"
      >
        ＋ Add class to {DAY_FULL[day]}
      </button>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Set any start/end time — classes can be any length and each day is
        independent. Tap ✓ to flip a block into a free study window.
      </p>
    </Card>
  );
}
