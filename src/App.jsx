import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "./context/AppContext";
import { ThemeHeader } from "./components/ThemeHeader";
import { NavBar } from "./components/NavBar";
import { Overview } from "./components/Overview";
import { AcademicSchedule } from "./components/AcademicSchedule";
import { DueCalendar } from "./components/DueCalendar";
import { TriageList } from "./components/TriageList";
import { FocusTimer } from "./components/FocusTimer";
import { SideProjects } from "./components/SideProjects";

function CloudStatus() {
  const { sync } = useApp();
  const label = {
    offline: "saved locally",
    idle: "saved locally",
    loading: "connecting to cloud…",
    saving: "saving to cloud…",
    saved: "saved locally + cloud ☁️",
    error: "cloud backup offline",
  }[sync.status] || "saved locally";

  return (
    <footer className="mt-8 flex items-center justify-between px-1 text-[11px] text-zinc-600">
      <span>Lock In · dashboard</span>
      <span>Data {label}</span>
    </footer>
  );
}

const viewTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: "easeOut" },
};

export default function App() {
  const { crunchWeek } = useApp();
  const [activeView, setActiveView] = useState("overview");

  // Crunch week hides side projects — bounce off that page if it gets enabled
  useEffect(() => {
    if (crunchWeek && activeView === "projects") setActiveView("overview");
  }, [crunchWeek, activeView]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Persistent header — always visible */}
      <ThemeHeader />

      {/* Persistent navigation */}
      <NavBar
        active={activeView}
        onNavigate={setActiveView}
        crunchWeek={crunchWeek}
      />

      {/* Crunch banner */}
      <AnimatePresence initial={false}>
        {crunchWeek && (
          <motion.div
            key="crunch-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-center text-xs font-bold text-rose-300">
              🔥 Crunch Week — side projects are paused. Only the red matters.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active page */}
      <main className="mt-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeView} {...viewTransition}>
            {activeView === "overview" && <Overview onNavigate={setActiveView} />}
            {activeView === "schedule" && (
              <div className="mx-auto max-w-3xl">
                <AcademicSchedule />
              </div>
            )}
            {activeView === "due" && (
              <div className="mx-auto max-w-4xl">
                <DueCalendar onNavigate={setActiveView} />
              </div>
            )}
            {activeView === "triage" && (
              <div className="mx-auto max-w-3xl">
                <TriageList />
              </div>
            )}
            {activeView === "focus" && (
              <div className="mx-auto max-w-xl">
                <FocusTimer />
              </div>
            )}
            {activeView === "projects" && !crunchWeek && (
              <div className="mx-auto max-w-3xl">
                <SideProjects />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <CloudStatus />
    </div>
  );
}
