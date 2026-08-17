import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { Card, SectionTitle, ProgressBar } from "./ui";

const SAVINGS_GOAL = 10000;
const kr = (n) => `${n.toLocaleString("sv-SE")} kr`;

function SavingsTracker() {
  const { savings, setSavings } = useApp();
  const clamp = (n) => Math.max(0, Math.min(SAVINGS_GOAL, Math.round(n)));

  return (
    <div className="rounded-xl border border-line bg-black/20 p-3.5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300">
          10,000 kr Goal
        </span>
        <span className="text-xs font-bold tabular-nums text-zinc-300">
          {kr(savings)}
          <span className="font-medium text-zinc-500"> / {kr(SAVINGS_GOAL)}</span>
        </span>
      </div>
      <ProgressBar
        value={savings / SAVINGS_GOAL}
        tone="from-violet-500 to-fuchsia-400"
        className="mb-3"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSavings(clamp(savings - 100))}
          className="press cursor-pointer rounded-lg border border-line bg-zinc-800/60 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:border-line-strong"
        >
          −100
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            max={SAVINGS_GOAL}
            value={savings}
            onChange={(e) => setSavings(clamp(e.target.valueAsNumber || 0))}
            aria-label="Saved amount in kronor"
            className="field tabular-nums"
          />
        </div>
        <button
          onClick={() => setSavings(clamp(savings + 100))}
          className="press cursor-pointer rounded-lg border border-line bg-zinc-800/60 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:border-line-strong"
        >
          +100
        </button>
        <button
          onClick={() => setSavings(clamp(savings + 500))}
          className="press cursor-pointer rounded-lg bg-violet-500/90 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-violet-400"
        >
          +500
        </button>
      </div>
      {savings >= SAVINGS_GOAL && (
        <p className="mt-2 text-[11px] font-semibold text-violet-300">
          🎉 Goal hit — 10,000 kr. Set the next number.
        </p>
      )}
    </div>
  );
}

function ProjectRow({ project }) {
  const { toggleProject, deleteProject } = useApp();
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group flex items-center gap-3 rounded-xl border border-line bg-black/20 px-3 py-2 transition-colors duration-200 hover:bg-white/[0.04]"
    >
      <button
        type="button"
        onClick={() => toggleProject(project.id)}
        aria-label={project.done ? "Mark as not started" : "Mark as done"}
        className={`press flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors duration-200 ${
          project.done
            ? "border-violet-400/60 bg-violet-500 text-zinc-950"
            : "border-line-strong bg-black/30 hover:border-zinc-500"
        }`}
      >
        <motion.svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          initial={false}
          animate={project.done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        >
          <path
            d="M2 6.5 4.8 9 10 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>
      <span
        className={`min-w-0 flex-1 truncate text-sm transition-colors duration-200 ${
          project.done ? "text-zinc-500 line-through" : "text-zinc-100"
        }`}
      >
        {project.title}
      </span>
      <button
        type="button"
        onClick={() => deleteProject(project.id)}
        aria-label={`Delete ${project.title}`}
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

export function SideProjects() {
  const { techProjects, addProject } = useApp();
  const [title, setTitle] = useState("");

  const submit = (e) => {
    e.preventDefault();
    addProject(title);
    setTitle("");
  };

  return (
    <Card className="p-5">
      <SectionTitle
        eyebrow="Side Projects"
        title="Goals & Builds"
        right={
          <span className="rounded-full border border-line bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-violet-300/80">
            {techProjects.filter((p) => p.done).length}/{techProjects.length} shipped
          </span>
        }
      />

      <div className="flex flex-col gap-3">
        <SavingsTracker />

        <div className="rounded-xl border border-line bg-black/20 p-3.5">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            💻 Tech Projects
          </h3>
          <form onSubmit={submit} className="mb-2.5 flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Python build, portfolio, bot…"
              aria-label="New project"
              className="field"
            />
            <button
              type="submit"
              className="press shrink-0 cursor-pointer rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400"
            >
              Add
            </button>
          </form>
          {techProjects.length === 0 ? (
            <p className="px-1 py-2 text-xs text-zinc-600">
              No projects yet — add something you're building on the side.
            </p>
          ) : (
            <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {techProjects.map((p) => (
                  <ProjectRow key={p.id} project={p} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
