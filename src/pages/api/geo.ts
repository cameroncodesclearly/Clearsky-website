import type { APIRoute } from 'astro';

// Tells the consent banner which privacy rules apply to the visitor, from
// Vercel's IP geolocation (country and region only; nothing is stored).
//   optIn: analytics may only start after the visitor agrees (GDPR in the
//          EEA, UK GDPR, Swiss FADP, Quebec Law 25, Brazil LGPD)
//   otherwise analytics runs with an easy opt-out (US state privacy laws),
//   and Global Privacy Control / Do Not Track signals are always honoured.
export const prerender = false;

const EEA = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO'.split(' ');
const OPT_IN = new Set([...EEA, 'GB', 'CH', 'BR']);

export const GET: APIRoute = ({ request }) => {
  const country = request.headers.get('x-vercel-ip-country') || '';
  const region = request.headers.get('x-vercel-ip-country-region') || '';
  // Unknown location: assume the strictest rules.
  const optIn = !country || OPT_IN.has(country) || (country === 'CA' && region === 'QC');
  return new Response(JSON.stringify({ country, region, optIn }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
};
