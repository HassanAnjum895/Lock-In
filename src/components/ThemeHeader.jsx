import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { Toggle } from "./ui";

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function ThemeHeader() {
  const { themeSentence, setThemeSentence, crunchWeek, setCrunchWeek } =
    useApp();

  return (
    <motion.header
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bento-card col-span-12 p-5 sm:p-6 ${
        crunchWeek
          ? "border-rose-400/30 shadow-[0_0_40px_-12px_rgba(244,63,94,0.35)]"
          : ""
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        {/* Theme input */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Theme of the Week</p>
            <p className="text-[11px] font-medium text-zinc-500">{today}</p>
          </div>
          <input
            type="text"
            value={themeSentence}
            onChange={(e) => setThemeSentence(e.target.value)}
            placeholder="e.g. Heavy HP Prep"
            aria-label="Theme of the week"
            className="mt-2 w-full bg-transparent text-xl font-extrabold tracking-tight text-zinc-100 placeholder:text-zinc-600 focus:outline-none sm:text-3xl"
          />
          <p className="mt-1 truncate text-xs text-zinc-500">
            {themeSentence.trim()
              ? `One sentence. This week is about: ${themeSentence.trim()}`
              : "Type a single focus sentence for the week."}
          </p>
        </div>

        {/* CRUNCH WEEK */}
        <div className="flex shrink-0 items-center gap-4 rounded-xl border border-line bg-black/20 px-4 py-3">
          <Toggle
            checked={crunchWeek}
            onChange={setCrunchWeek}
            label="Crunch Week"
          />
          <motion.span
            key={crunchWeek ? "on" : "off"}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="text-2xl"
            aria-hidden
          >
            {crunchWeek ? "🔥" : "😌"}
          </motion.span>
        </div>
      </div>
    </motion.header>
  );
}
