import { useState } from "react";
import { useApp } from "../context/AppContext";

const STATUS = {
  offline: { dot: "bg-zinc-600", text: "Cloud backup not configured" },
  idle: { dot: "bg-zinc-600", text: "Cloud backup not configured" },
  loading: { dot: "bg-amber-400 animate-pulse", text: "Connecting to cloud…" },
  saving: { dot: "bg-amber-400 animate-pulse", text: "Saving to cloud…" },
  saved: { dot: "bg-emerald-400", text: "Backed up to cloud" },
  error: { dot: "bg-rose-400", text: "Backup error — will retry on next change" },
};

export function CloudSync() {
  const { sync } = useApp();
  const [copied, setCopied] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [restoreMsg, setRestoreMsg] = useState(null);

  const s = STATUS[sync.status] || STATUS.offline;

  const copyKey = async () => {
    if (!sync.syncId) return;
    try {
      await navigator.clipboard.writeText(sync.syncId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const restore = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setRestoreMsg(null);
    try {
      const data = await sync.restoreWithKey(keyInput);
      setRestoreMsg(
        data
          ? "Restored — your data is back."
          : "No backup found for that key — make sure both devices use the same backend URL (VITE_CONVEX_URL)."
      );
      setKeyInput("");
    } catch {
      setRestoreMsg("Could not reach the backup service — check your connection.");
    }
  };

  return (
    <div className="rounded-xl border border-line bg-black/20 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          ☁️ Cloud Backup
        </h3>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.text}
        </span>
      </div>

      {sync.enabled && sync.syncId ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] text-zinc-500">
              Recovery key
            </span>
            <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-black/30 px-2 py-1 text-[11px] font-semibold text-zinc-300">
              {sync.syncId}
            </code>
            <button
              onClick={copyKey}
              className="press shrink-0 cursor-pointer rounded-md border border-line bg-zinc-800/60 px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:border-line-strong hover:text-zinc-100"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <form onSubmit={restore} className="flex items-center gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste a recovery key to restore…"
              aria-label="Recovery key"
              className="field min-w-0 flex-1 py-1.5! text-xs"
            />
            <button
              type="submit"
              className="press shrink-0 cursor-pointer rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1.5 text-[11px] font-bold text-indigo-200 hover:bg-indigo-500/25"
            >
              Restore
            </button>
          </form>

          {restoreMsg && (
            <p className="text-[11px] font-medium text-zinc-400">{restoreMsg}</p>
          )}

          <p className="text-[11px] leading-relaxed text-zinc-500">
            Your data is saved automatically to the cloud. Copy this recovery
            key somewhere safe (e.g. your password manager) — after a browser
            wipe or on a new device, paste it above to get everything back.
          </p>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Automatic cloud backup is not configured yet. In the project, run{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-zinc-300">
            npx convex dev
          </code>{" "}
          once — it creates the free backend and writes the URL the app needs.
          Everything keeps working locally meanwhile.
        </p>
      )}
    </div>
  );
}
