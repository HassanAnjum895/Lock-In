import { useConvexAuth } from "@convex-dev/auth/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";

const HAS_CONVEX = !!import.meta.env.VITE_CONVEX_URL;

const STATUS = {
  offline: { dot: "bg-zinc-600", text: "Cloud sync not configured" },
  "signed-out": { dot: "bg-zinc-600", text: "Signed out — saved on this device only" },
  loading: { dot: "bg-amber-400 animate-pulse", text: "Connecting to cloud…" },
  saving: { dot: "bg-amber-400 animate-pulse", text: "Saving to cloud…" },
  saved: { dot: "bg-emerald-400", text: "Synced — live on all your devices" },
  error: { dot: "bg-rose-400", text: "Sync error — will retry on next change" },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function CloudSync() {
  const { sync } = useApp();

  if (!HAS_CONVEX) {
    // Offline build (no backend URL) — no auth hooks available.
    const s = STATUS[sync.status] || STATUS.offline;
    return (
      <div className="rounded-xl border border-line bg-black/20 p-3.5">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            🔐 Account & Sync
          </h3>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.text}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Cloud sync is not configured yet. In the project, run{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-zinc-300">
            npx convex dev
          </code>{" "}
          once — it creates the free backend and writes the URL the app needs.
          Everything keeps working locally meanwhile.
        </p>
      </div>
    );
  }

  return <CloudSyncPanel />;
}

function CloudSyncPanel() {
  const { sync } = useApp();
  const { isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const user = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  const s = STATUS[sync.status] || STATUS.offline;

  return (
    <div className="rounded-xl border border-line bg-black/20 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          🔐 Account & Sync
        </h3>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.text}
        </span>
      </div>

      {isAuthenticated ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt=""
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-zinc-200">
                {user?.name || "Signed in"}
              </p>
              {user?.email && (
                <p className="truncate text-[11px] text-zinc-500">
                  {user.email}
                </p>
              )}
            </div>
            <button
              onClick={() => void signOut()}
              className="press shrink-0 cursor-pointer rounded-md border border-line bg-zinc-800/60 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 hover:border-line-strong hover:text-zinc-100"
            >
              Sign out
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-500">
            Everything is saved to your account and syncs automatically to any
            device signed in with the same Google account — no keys to copy.
            Sign in on another device and your data will be there.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Sign in with Google to save your data to the cloud and see it on
            every device. Until then, everything is saved only on this device.
          </p>
          <button
            onClick={() => void signIn("google")}
            className="press inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-md border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25"
          >
            <GoogleIcon /> Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
