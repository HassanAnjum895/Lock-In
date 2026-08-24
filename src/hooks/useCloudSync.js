import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

/**
 * Account-based cloud sync via Convex.
 *
 * When a user is signed in, the app subscribes to the account's backup
 * document in real time: changes pushed from ANY device (this one included)
 * arrive via the live query and are applied locally, so every signed-in
 * device stays in sync automatically. When signed out, everything just works
 * locally and nothing is uploaded.
 *
 * Requires VITE_CONVEX_URL (written to .env.local by `npx convex dev`).
 * When it's missing the app runs in offline mode.
 */
const HAS_CONVEX = !!import.meta.env.VITE_CONVEX_URL;

/** Offline build (no backend URL): local-only, no auth, no sync. */
function useCloudSyncOffline() {
  return {
    enabled: false,
    isAuthenticated: false,
    authLoading: false,
    status: "offline",
    loading: false,
    remote: null,
    save: async () => {},
  };
}

function useCloudSyncOnline() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  // Real-time subscription to the signed-in user's backup. "skip" keeps the
  // query inert while signed out (the backend requires an identity).
  const remoteRow = useQuery(
    api.backups.getBackup,
    isAuthenticated ? {} : "skip"
  );
  const saveBackup = useMutation(api.backups.saveBackup);

  const [lastStatus, setLastStatus] = useState("saved");

  // remote = the backup document's data (null when the account has no backup
  // yet, undefined while the first fetch for this session is in flight).
  const remote = remoteRow?.data ?? null;

  const save = useCallback(
    async (data) => {
      if (!isAuthenticated) return;
      setLastStatus("saving");
      try {
        await saveBackup({ data });
        setLastStatus("saved");
      } catch (err) {
        console.error("Cloud sync save failed:", err);
        setLastStatus("error");
      }
    },
    [isAuthenticated, saveBackup]
  );

  const status = !isAuthenticated
    ? "signed-out"
    : remoteRow === undefined
      ? "loading"
      : lastStatus;

  return {
    enabled: true,
    isAuthenticated,
    authLoading,
    status,
    loading: isAuthenticated && remoteRow === undefined,
    remote,
    save,
  };
}

export function useCloudSync() {
  if (!HAS_CONVEX) return useCloudSyncOffline();
  return useCloudSyncOnline();
}
