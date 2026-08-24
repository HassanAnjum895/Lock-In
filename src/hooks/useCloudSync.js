import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cloud backup via Convex's public HTTP API (no client SDK needed).
 * Requires VITE_CONVEX_URL (written to .env.local by `npx convex dev`).
 * When it's missing the app simply runs in offline mode.
 */
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function call(endpoint, body) {
  const res = await fetch(`${CONVEX_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.status !== "success") {
    throw new Error(json.errorMessage || `Convex ${endpoint} failed`);
  }
  return json.value;
}

export function useCloudSync() {
  const [syncId, setSyncId] = useState(() => {
    try {
      return window.localStorage.getItem("student-os.syncId") || null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState("idle"); // idle | offline | loading | saving | saved | error
  const [remote, setRemote] = useState(null); // last fetched backup data (or null)
  const [initialized, setInitialized] = useState(false); // initial pull resolved
  const idRef = useRef(syncId);
  const statusRef = useRef(status);
  statusRef.current = status;

  const persistId = useCallback((id) => {
    idRef.current = id;
    try {
      window.localStorage.setItem("student-os.syncId", id);
    } catch {
      /* storage unavailable — keep in memory */
    }
    setSyncId(id);
  }, []);

  const pull = useCallback(async (id) => {
    const row = await call("/api/query", {
      path: "backups:getBackup",
      args: { anonymousId: id },
      format: "json",
    });
    return row?.data ?? null;
  }, []);

  // Initial load: fetch the backup for the stored key (or mint a fresh key)
  useEffect(() => {
    if (!CONVEX_URL) {
      setStatus("offline");
      setInitialized(true);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        if (!idRef.current) persistId(uid());
        const data = await pull(idRef.current);
        if (cancelled) return;
        setRemote(data);
        setStatus("saved");
      } catch (err) {
        console.error("Cloud sync load failed:", err);
        if (!cancelled) setStatus("error");
      } finally {
        if (!cancelled) setInitialized(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(
    async (data, id = idRef.current) => {
      if (!CONVEX_URL || !id) return;
      setStatus("saving");
      try {
        await call("/api/mutation", {
          path: "backups:saveBackup",
          args: { anonymousId: id, data },
          format: "json",
        });
        setStatus("saved");
      } catch (err) {
        console.error("Cloud sync save failed:", err);
        setStatus("error");
      }
    },
    []
  );

  /** Point the app at an existing backup key (recovery after a browser wipe). */
  const restoreWithKey = useCallback(
    async (key) => {
      const clean = String(key || "").trim();
      if (!clean) return null;
      persistId(clean);
      setStatus("loading");
      try {
        const data = await pull(clean);
        setRemote(data);
        setStatus("saved");
        return data;
      } catch (err) {
        console.error("Cloud sync restore failed:", err);
        setStatus("error");
        throw err;
      }
    },
    [persistId, pull]
  );

  return {
    enabled: !!CONVEX_URL,
    syncId,
    status,
    remote,
    initialized,
    save,
    restoreWithKey,
  };
}
