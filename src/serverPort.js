// Multi-port dynamic scanner for local ESP32 flashing server
const CANDIDATE_PORTS = [3002, 3005, 3001, 5005];

let cachedServerUrl = null;

export async function getActiveServerUrl() {
  if (cachedServerUrl) {
    try {
      const check = await fetch(`${cachedServerUrl}/ports`, { method: 'GET', signal: AbortSignal.timeout(600) });
      if (check.ok) return cachedServerUrl;
    } catch (e) {
      cachedServerUrl = null;
    }
  }

  for (const port of CANDIDATE_PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/ports`, { method: 'GET', signal: AbortSignal.timeout(600) });
      if (res.ok) {
        cachedServerUrl = `http://localhost:${port}`;
        return cachedServerUrl;
      }
    } catch (e) {
      // Continue searching next candidate port
    }
  }

  return 'http://localhost:3002';
}
