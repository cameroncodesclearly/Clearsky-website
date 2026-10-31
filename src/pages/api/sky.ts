import type { APIRoute } from 'astro';

// Live sky for the homepage: the visitor's current weather and time of day.
// Location comes from Vercel's IP geolocation headers (city level, no browser
// permission prompt). Weather is MET Norway's Locationforecast (CC BY 4.0,
// credited in the footer). Time of day comes from the sun's elevation at that
// spot right now, so sunrise and sunset follow the real sky.
export const prerender = false;

export type Condition = 'clear' | 'partly' | 'overcast' | 'rain' | 'storm' | 'snow' | 'fog';
export type Phase = 'morning' | 'afternoon' | 'sunset' | 'night';
export interface Sky { condition: Condition; intensity: number; phase: Phase }

const FALLBACK: Sky = { condition: 'clear', intensity: 1, phase: 'afternoon' };
const TTL = 15 * 60 * 1000;
// MET asks clients to cache and reuse forecasts; nearby visitors share one.
const cache = new Map<string, { at: number; symbol: string }>();

/** MET symbol codes look like "lightrainshowers_day" or "heavyrainandthunder". */
function toCondition(symbol: string): Pick<Sky, 'condition' | 'intensity'> {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '');
  const intensity = s.startsWith('light') ? 0.6 : s.startsWith('heavy') ? 1.4 : 1;
  if (s.includes('thunder')) return { condition: 'storm', intensity };
  if (s.includes('snow') || s.includes('sleet')) return { condition: 'snow', intensity };
  if (s.includes('rain')) return { condition: 'rain', intensity };
  if (s === 'fog') return { condition: 'fog', intensity: 1 };
  if (s === 'cloudy') return { condition: 'overcast', intensity: 1 };
  if (s === 'partlycloudy' || s === 'fair') return { condition: 'partly', intensity: 1 };
  return { condition: 'clear', intensity: 1 };
}

/** Sun elevation in degrees and whether it is still before solar noon. */
function sunPosition(lat: number, lon: number, when: Date) {
  const rad = Math.PI / 180;
  const d = when.getTime() / 86400000 + 2440587.5 - 2451545; // days since J2000
  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) * 15;
  const ha = ((((gmst + lon - ra) % 360) + 540) % 360) - 180; // hour angle, -180..180
  const elevation = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha * rad)) / rad;
  return { elevation, beforeNoon: ha < 0 };
}

function toPhase(lat: number, lon: number): Phase {
  const { elevation, beforeNoon } = sunPosition(lat, lon, new Date());
  if (elevation < -6) return 'night';
  if (elevation < 10) return beforeNoon ? 'morning' : 'sunset';
  if (beforeNoon && elevation < 25) return 'morning';
  return 'afternoon';
}

async function symbolAt(lat: number, lon: number): Promise<string> {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.symbol;
  // MET wants at most four decimals and an identifying User-Agent.
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ClearSkyCreations/1.0 https://www.clearskycreations.com' },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`MET ${res.status}`);
  const data = await res.json();
  const now = data.properties.timeseries[0].data;
  const symbol: string = now.next_1_hours?.summary?.symbol_code ?? now.next_6_hours?.summary?.symbol_code ?? 'clearsky_day';
  cache.set(key, { at: Date.now(), symbol });
  return symbol;
}

export const GET: APIRoute = async ({ request }) => {
  const lat = Number(request.headers.get('x-vercel-ip-latitude'));
  const lon = Number(request.headers.get('x-vercel-ip-longitude'));
  let sky: Sky = FALLBACK;
  if (request.headers.get('x-vercel-ip-latitude') && Number.isFinite(lat) && Number.isFinite(lon)) {
    try {
      sky = { ...toCondition(await symbolAt(lat, lon)), phase: toPhase(lat, lon) };
    } catch {
      sky = { ...FALLBACK, phase: toPhase(lat, lon) };
    }
  }
  return new Response(JSON.stringify(sky), {
    headers: {
      'Content-Type': 'application/json',
      // Per visitor (the answer depends on their location), so never shared by the CDN.
      'Cache-Control': 'private, max-age=600',
    },
  });
};
