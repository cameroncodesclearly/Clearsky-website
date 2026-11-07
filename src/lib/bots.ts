// Who may crawl the site. Used by src/pages/robots.txt.ts (the polite request)
// and copied into the user-agent "redirects" rules in vercel.json (the
// enforcement: blocked crawlers are sent to /api/blocked, a 403, before any
// page is served). After editing these lists, update the pattern in vercel.json.
//
// Allowed: search engines (so the site and journal still rank), link-preview
// bots (so shared links still show the logo card) and AI search assistants
// that fetch a page only when someone asks about it and link back to it.
// Blocked: AI training crawlers, SEO/data scrapers and site-copying tools.

/** AI crawlers that collect pages to train models or build datasets. */
export const AI_TRAINING_BOTS = [
  'GPTBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'CCBot', 'Google-Extended', 'Applebot-Extended',
  'Bytespider', 'PerplexityBot', 'Meta-ExternalAgent', 'Meta-ExternalFetcher', 'FacebookBot', 'Amazonbot',
  'cohere-ai', 'cohere-training-data-crawler', 'Diffbot', 'ImagesiftBot', 'Omgilibot', 'omgili', 'YouBot',
  'Timpibot', 'AI2Bot', 'Ai2Bot-Dolma', 'Kangaroo Bot', 'PanguBot', 'Scrapy', 'img2dataset', 'DeepSeekBot',
  'Brightbot', 'QualifiedBot', 'TikTokSpider', 'VelenPublicWebCrawler', 'Webzio-Extended', 'iaskspider',
];

/** SEO crawlers, data brokers and tools that copy whole sites. */
export const SCRAPERS = [
  'SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot', 'PetalBot', 'BLEXBot', 'DataForSeoBot', 'SerpstatBot',
  'MegaIndex', 'Barkrowler', 'Seekport', 'HTTrack', 'Wget', 'SiteSucker', 'WebCopier', 'Offline Explorer',
  'Teleport', 'WebZIP', 'python-requests', 'python-urllib', 'aiohttp', 'httpx', 'Go-http-client', 'node-fetch',
  'axios', 'libwww-perl', 'curl/', 'HeadlessChrome', 'PhantomJS', 'Java/', 'okhttp', 'Apache-HttpClient',
];

// Some names are only honoured through robots.txt (they share a user agent
// with a search crawler we want to keep), so they aren't matched at the edge.
const ROBOTS_ONLY = new Set(['Google-Extended', 'Applebot-Extended', 'Webzio-Extended']);
export const ROBOTS_ONLY_BOTS = ROBOTS_ONLY;
