import { motion } from "framer-motion";

export const NAV_ITEMS = [
  { key: "overview", label: "Overview", emoji: "📊" },
  { key: "schedule", label: "Schedule", emoji: "📅" },
  { key: "due", label: "Due", emoji: "📆" },
  { key: "triage", label: "Triage", emoji: "✅" },
  { key: "focus", label: "Focus", emoji: "⏱️" },
  { key: "projects", label: "Projects", emoji: "💼" },
];

export function NavBar({ active, onNavigate, crunchWeek }) {
  const items = crunchWeek
    ? NAV_ITEMS.filter((i) => i.key !== "projects")
    : NAV_ITEMS;

  return (
    <nav
      aria-label="Main navigation"
      className="bento-card mt-4 flex flex-row gap-1.5 p-2 sm:gap-2"
    >
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            aria-current={isActive ? "page" : undefined}
            className="press relative flex-1 cursor-pointer rounded-xl px-2 py-2.5"
          >
            {isActive && (
              <motion.span
                layoutId="nav-active"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl border border-indigo-400/40 bg-indigo-500/10 shadow-[0_0_18px_-6px_rgba(99,102,241,0.6)]"
              />
            )}
            <span
              className={`relative z-10 flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "text-indigo-200"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span aria-hidden>{item.emoji}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
