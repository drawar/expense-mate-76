/**
 * Recover from stale-chunk errors after a fresh deploy.
 *
 * When Vite ships a new build, chunk filenames get new content hashes.
 * Any tab that still has the old HTML in memory will 404 the next time
 * it tries to lazy-load a route/component (React.lazy → dynamic import).
 * The error surfaces as one of the messages below, depending on browser:
 *
 *   - "Failed to fetch dynamically imported module"
 *   - "Importing a module script failed"
 *   - "Loading chunk N failed"
 *   - "error loading dynamically imported module"
 *
 * Strategy: catch those specific errors and force a one-shot page reload
 * so the browser pulls the fresh HTML + chunks. A sessionStorage flag
 * throttles reloads to at most one per 30 s so a genuinely-broken build
 * doesn't reload-loop forever.
 */

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Loading chunk .+ failed/i,
  /Loading CSS chunk .+ failed/i,
];

const RELOAD_FLAG_KEY = "clairo:chunk-reload-attempted-at";
const RELOAD_THROTTLE_MS = 30_000;

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String((err as { message?: string })?.message ?? err);
  return CHUNK_ERROR_PATTERNS.some((r) => r.test(msg));
}

/**
 * Reload the page at most once every RELOAD_THROTTLE_MS. Returns true if a
 * reload was actually triggered so callers can suppress default error UI.
 */
export function reloadOnceForStaleChunk(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(RELOAD_FLAG_KEY) ?? "0");
    if (now - last < RELOAD_THROTTLE_MS) return false;
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(now));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Attach global handlers so stale-chunk errors that never hit a React
 * ErrorBoundary (unhandled promise rejections, plain window errors) still
 * trigger the recovery reload.
 */
export function installGlobalChunkErrorHandlers(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason) && reloadOnceForStaleChunk()) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    if (
      isChunkLoadError(event.error ?? event.message) &&
      reloadOnceForStaleChunk()
    ) {
      event.preventDefault();
    }
  });
}
