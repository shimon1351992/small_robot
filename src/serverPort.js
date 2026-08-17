// Multi-port dynamic scanner for local & cloud ESP32 flashing server
const CANDIDATE_PORTS = [3002, 3001, 3005, 5005];
const CANDIDATE_HOSTS = ['127.0.0.1', 'localhost'];
const RENDER_SERVER_URL = 'https://small-robot.onrender.com';

let cachedServerUrl = null;

export async function getActiveServerUrl() {
  if (cachedServerUrl) {
    try {
      const check = await fetch(`${cachedServerUrl}/ports`, { method: 'GET', mode: 'cors', signal: AbortSignal.timeout(600) });
      if (check.ok) return cachedServerUrl;
    } catch (e) {
      cachedServerUrl = null;
    }
  }

  // 1. Try Local PC Server on 127.0.0.1 & localhost
  for (const host of CANDIDATE_HOSTS) {
    for (const port of CANDIDATE_PORTS) {
      try {
        const url = `http://${host}:${port}`;
        const res = await fetch(`${url}/ports`, { 
          method: 'GET', 
          mode: 'cors',
          signal: AbortSignal.timeout(600) 
        });
        if (res.ok) {
          cachedServerUrl = url;
          return cachedServerUrl;
        }
      } catch (e) {}
    }
  }

  // 2. Try Render Cloud Server
  try {
    const cloudCheck = await fetch(`${RENDER_SERVER_URL}/ports`, { method: 'GET', mode: 'cors', signal: AbortSignal.timeout(2000) });
    if (cloudCheck.ok) {
      cachedServerUrl = RENDER_SERVER_URL;
      return cachedServerUrl;
    }
  } catch (e) {}

  return RENDER_SERVER_URL;
}
