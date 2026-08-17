// Multi-port dynamic scanner for local & cloud ESP32 flashing server
const CANDIDATE_PORTS = [3002, 3005, 3001, 5005];
const RENDER_SERVER_URL = 'https://small-robot.onrender.com';

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

  // 1. Try Local PC Server ports first
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

  // 2. Try Render Cloud Server
  try {
    const cloudCheck = await fetch(`${RENDER_SERVER_URL}/ports`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (cloudCheck.ok) {
      cachedServerUrl = RENDER_SERVER_URL;
      return cachedServerUrl;
    }
  } catch (e) {}

  return RENDER_SERVER_URL;
}
