import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export function Card({ children, className = "" }) {
  return <section className={`bento-card ${className}`}>{children}</section>;
}

export function SectionTitle({ eyebrow, title, right }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 truncate text-base font-bold text-zinc-100">
          {title}
        </h2>
      </div>
      {right}
    </header>
  );
}

/** Animated switch. `label` shows next to the track, `onText` under it. */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="press group flex cursor-pointer items-center gap-3"
    >
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out ${
          checked
            ? "border-rose-400/50 bg-rose-500 shadow-[0_0_18px_-2px_rgba(244,63,94,0.6)]"
            : "border-line-strong bg-zinc-700/60"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-md ${
            checked ? "ml-auto mr-1" : "ml-1"
          }`}
        />
      </span>
      <span className="text-left">
        <span
          className={`block text-xs font-bold uppercase tracking-[0.16em] transition-colors duration-200 ${
            checked ? "text-rose-300" : "text-zinc-300"
          }`}
        >
          {label}
        </span>
        <span className="mt-0.5 hidden text-[11px] text-zinc-500 sm:block">
          {checked
            ? "Focus lock — side projects muted"
            : "Side projects visible"}
        </span>
      </span>
    </button>
  );
}

/** Thin animated progress bar. `tone` is a tailwind gradient class set. */
export function ProgressBar({ value, tone = "from-indigo-500 to-violet-500", className = "" }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${tone}`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: EASE }}
      />
    </div>
  );
}
