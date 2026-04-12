// frontend/src/hooks/usePolling.js — Auto-refresh hook
// Usage: const data = usePolling(fetchFn, intervalMs)
// This is a vanilla JS polling utility since the dashboard is served as static HTML.
export function createPoller(fetchFn, intervalMs = 30000, onData, onError) {
  let timer = null;
  let running = false;

  async function tick() {
    try {
      const data = await fetchFn();
      if (onData) onData(data);
    } catch (err) {
      if (onError) onError(err);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      tick();
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
    },
    isRunning() { return running; },
  };
}

export default createPoller;
