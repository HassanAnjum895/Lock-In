import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp, PRESETS } from "../context/AppContext";
import { Card, SectionTitle } from "./ui";

const R = 52;
const C = 2 * Math.PI * R;

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function FocusTimer() {
  const { timer, selectPreset, setCustomTimer, resetTimer, tickTimer } = useApp();
  const [running, setRunning] = useState(false);
  const [customMin, setCustomMin] = useState(() => timer.customMinutes ?? 25);
  const [customSec, setCustomSec] = useState(() => timer.customSeconds ?? 0);

  const { secondsLeft, total, preset } = timer;
  const progress = total ? secondsLeft / total : 0;
  const done = secondsLeft === 0;
  const label = preset === "custom" ? "Custom Focus" : PRESETS[preset].label;

  // Keep the custom editor in sync when a preset or custom time is applied
  useEffect(() => {
    setCustomMin(timer.customMinutes ?? Math.floor(total / 60));
    setCustomSec(timer.customSeconds ?? total % 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  // Countdown driver
  useEffect(() => {
    if (!running) return;
    const id = setInterval(tickTimer, 1000);
    return () => clearInterval(id);
  }, [running, tickTimer]);

  // Stop when the countdown hits zero
  useEffect(() => {
    if (secondsLeft === 0) setRunning(false);
  }, [secondsLeft]);

  const pickPreset = (key) => {
    setRunning(false);
    selectPreset(key);
  };

  const applyCustom = () => {
    setRunning(false);
    setCustomTimer(customMin, customSec);
  };

  return (
    <motion.div
      layout
      animate={
        running
          ? {
              boxShadow: [
                "0 0 26px -6px rgba(129,140,248,0.45)",
                "0 0 52px -8px rgba(129,140,248,0.7)",
                "0 0 26px -6px rgba(129,140,248,0.45)",
              ],
            }
          : { boxShadow: "0 12px 32px -12px rgba(0,0,0,0.55)" }
      }
      transition={{ duration: 2.2, ease: "easeInOut", repeat: running ? Infinity : 0 }}
      className="h-full rounded-2xl"
    >
      <Card
        className={`p-5 transition-colors duration-300 ${
          running ? "border-indigo-400/40" : ""
        }`}
      >
        <SectionTitle
          eyebrow="Focus Timer"
          title="Deep Work"
          right={
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors duration-300 ${
                running
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {running && (
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                />
              )}
              {running ? "FOCUSING" : done ? "DONE" : "IDLE"}
            </span>
          }
        />

        {/* Presets */}
        <div className="mb-2 flex flex-col gap-2 sm:flex-row">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => pickPreset(key)}
              className={`press flex flex-1 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors duration-200 ease-out ${
                preset === key
                  ? "border-indigo-400/40 bg-indigo-500/10 text-zinc-100"
                  : "border-line bg-black/20 text-zinc-400 hover:border-line-strong hover:text-zinc-200"
              }`}
            >
              <span className="text-sm font-semibold">
                {p.emoji} {p.label}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-zinc-500">
                {p.minutes} min
              </span>
            </button>
          ))}
        </div>

        {/* Custom duration */}
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors duration-200 ease-out ${
            preset === "custom"
              ? "border-indigo-400/40 bg-indigo-500/10"
              : "border-line bg-black/20"
          }`}
        >
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Custom
          </span>
          <input
            type="number"
            min={0}
            max={600}
            value={customMin}
            aria-label="Custom minutes"
            onChange={(e) =>
              setCustomMin(Math.max(0, Math.floor(e.target.valueAsNumber || 0)))
            }
            className="field w-16 px-2 py-1.5! text-center text-sm font-bold tabular-nums"
          />
          <span className="shrink-0 text-xs text-zinc-500">min</span>
          <input
            type="number"
            min={0}
            max={59}
            value={customSec}
            aria-label="Custom seconds"
            onChange={(e) =>
              setCustomSec(
                Math.min(59, Math.max(0, Math.floor(e.target.valueAsNumber || 0)))
              )
            }
            className="field w-14 px-2 py-1.5! text-center text-sm font-bold tabular-nums"
          />
          <span className="shrink-0 text-xs text-zinc-500">sec</span>
          <button
            onClick={applyCustom}
            className="press ml-auto shrink-0 cursor-pointer rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-200 transition-colors duration-200 ease-out hover:bg-indigo-500/25"
          >
            Set
          </button>
        </div>

        {/* Dial */}
        <div className="relative mx-auto mb-5 h-40 w-40">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="7"
            />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              animate={running ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: running ? Infinity : 0, ease: "easeInOut" }}
              className={`text-4xl font-extrabold tabular-nums tracking-tight ${
                done ? "text-emerald-300" : "text-zinc-100"
              }`}
            >
              {fmt(secondsLeft)}
            </motion.span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {done ? "session complete" : label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={done}
            className={`press cursor-pointer rounded-xl py-2.5 text-sm font-bold transition-colors duration-200 ease-out ${
              running
                ? "bg-amber-500/90 text-zinc-950 hover:bg-amber-400"
                : "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_-6px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
            }`}
          >
            {running ? "Pause" : "Play"}
          </button>
          <button
            onClick={resetTimer}
            className="press cursor-pointer rounded-xl border border-line bg-black/25 py-2.5 text-sm font-bold text-zinc-300 transition-colors duration-200 ease-out hover:border-line-strong hover:text-zinc-100"
          >
            Reset
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
