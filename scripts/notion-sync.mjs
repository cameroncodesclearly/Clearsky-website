// Pulls published case studies and journal posts from Notion before each build
// and writes them as ordinary content files, so the site renders them with the
// same templates as everything else. Images (and video posters) are downloaded
// into src/assets, because Notion's own image links expire after an hour.
//
// Needs NOTION_TOKEN (a Notion internal integration with access to the
// "Website CMS" page). Without it the step is skipped and the site builds from
// the files already in the repo.
//
// Output (generated, not committed):
//   src/content/notion/case-studies/<slug>.mdoc
//   src/content/notion/posts/<slug>.mdoc
//   src/assets/notion/<page id>/...
//   src/assets/video-posters/<vimeo id>.jpg   (only for videos without one)

import fs from 'node:fs/promises';
import path from 'node:path';
import { framePolaroid } from './polaroid-frame.mjs';

const TOKEN = process.env.NOTION_TOKEN;
const API = process.env.NOTION_API_BASE || 'https://api.notion.com/v1';
const DATABASES = {
  caseStudies: process.env.NOTION_CASE_STUDIES_DB || '0a72a233a40b40e48544fb1ffa5ccc15',
  posts: process.env.NOTION_JOURNAL_DB || 'b59254addca44bb1b1dc623fd7585ace',
  photos: process.env.NOTION_PHOTOS_DB || '52fe6397306e4cb29e667f2a10cd257c',
};
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = {
  caseStudies: path.join(ROOT, 'src/content/notion/case-studies'),
  posts: path.join(ROOT, 'src/content/notion/posts'),
  polaroids: path.join(ROOT, 'public/polaroids/notion'),
  polaroidData: path.join(ROOT, 'src/data/polaroids.notion.json'),
  assets: path.join(ROOT, 'src/assets/notion'),
  posters: path.join(ROOT, 'src/assets/video-posters'),
};

// Notion multi-select names to the site's service slugs.
const SERVICE_SLUGS = {
  'Content Creation': 'content-creation',
  'The Testimony': 'the-testimony',
  Commercials: 'commercials',
  'UGC & Influencer': 'ugc-influencer',
  'Brand Strategy': 'brand-strategy',
  'Design and Web': 'design-and-web',
  'Ad Placement': 'ad-placement',
  'Company Announcements': 'company-announcements',
};

// ---------------------------------------------------------------------------
// Notion API

async function notion(method, url, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${url}`, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt < 5) {
      await new Promise((r) => setTimeout(r, 1000 * (Number(res.headers.get('retry-after')) || attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Notion ${method} ${url} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }
}

async function queryPublished(db, filter = { property: 'Status', status: { equals: 'Published' } }) {
  const rows = [];
  let cursor;
  do {
    const data = await notion('POST', `/databases/${db}/query`, {
      ...(filter ? { filter } : {}),
      start_cursor: cursor,
      page_size: 100,
    });
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return rows;
}

async function children(id) {
  const blocks = [];
  let cursor;
  do {
    const q = cursor ? `?page_size=100&start_cursor=${cursor}` : '?page_size=100';
    const data = await notion('GET', `/blocks/${id}/children${q}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  for (const b of blocks) if (b.has_children) b.children = await children(b.id);
  return blocks;
}

// ---------------------------------------------------------------------------
// Properties

const plain = (rt = []) => rt.map((t) => t.plain_text).join('');
const prop = (page, name) => page.properties?.[name];
const text = (page, name) => {
  const p = prop(page, name);
  if (!p) return '';
  if (p.type === 'title') return plain(p.title).trim();
  if (p.type === 'rich_text') return plain(p.rich_text).trim();
  if (p.type === 'url') return p.url || '';
  if (p.type === 'select') return p.select?.name || '';
  return '';
};
const num = (page, name) => prop(page, name)?.number ?? undefined;
const check = (page, name) => Boolean(prop(page, name)?.checkbox);
const multi = (page, name) => (prop(page, name)?.multi_select || []).map((o) => o.name);
const date = (page, name) => prop(page, name)?.date?.start || '';
const fileUrl = (f) => (f?.type === 'file' ? f.file.url : f?.external?.url);
const files = (page, name) => (prop(page, name)?.files || []).map(fileUrl).filter(Boolean);

export const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// ---------------------------------------------------------------------------
// Downloads

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' };

async function download(url, dir, name) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url.split('?')[0]}`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const ext = EXT[type] || path.extname(new URL(url).pathname).slice(1).toLowerCase() || 'jpg';
  if (!Object.values(EXT).includes(ext)) throw new Error(`Unsupported image type "${type || ext}". Use JPG, PNG or WebP.`);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name}.${ext}`);
  await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

// Video links: provider and id, matching src/lib/site.ts parseVideo.
export function videoId(url) {
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { provider: 'vimeo', id: vimeo[1] };
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  if (yt) return { provider: 'youtube', id: yt[1] };
  const ig = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/);
  if (ig) return { provider: 'instagram', id: ig[1] };
  return null;
}

// Fetch a poster for a video that doesn't have one yet, so the player has a
// still and the site can tell portrait from landscape.
async function ensurePoster(url) {
  const v = videoId(url);
  if (!v || v.provider === 'instagram') return;
  const existing = await fs.readdir(OUT.posters).catch(() => []);
  if (existing.some((f) => f.split('.')[0] === v.id)) return;
  try {
    let thumb;
    if (v.provider === 'vimeo') {
      const o = await (await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1920`)).json();
      thumb = o.thumbnail_url;
    } else {
      thumb = `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
    }
    if (thumb) await download(thumb, OUT.posters, v.id);
  } catch (e) {
    console.warn(`[notion] No poster for ${url}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Blocks to Markdoc

const esc = (s) => s.replace(/\{%/g, '{\\%');
const attr = (s) => JSON.stringify(s ?? '');

function inline(rt = []) {
  return rt
    .map((t) => {
      let s = esc(t.plain_text);
      if (!s.trim()) return s;
      const a = t.annotations || {};
      const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
      s = s.trim();
      if (a.code) s = '`' + s + '`';
      if (a.bold) s = `**${s}**`;
      if (a.italic) s = `_${s}_`;
      if (a.strikethrough) s = `~~${s}~~`;
      if (t.href) s = `[${s}](${t.href})`;
      return lead + s + trail;
    })
    .join('');
}

// A block that is only a video link: video/embed/bookmark blocks, or a
// paragraph holding nothing but a link.
function videoUrlOf(b) {
  const v = b[b.type];
  let url;
  if (b.type === 'video') url = fileUrl(v);
  else if (b.type === 'embed' || b.type === 'bookmark' || b.type === 'link_preview') url = v.url;
  else if (b.type === 'paragraph') {
    const s = plain(v.rich_text).trim();
    if (/^https?:\/\/\S+$/.test(s)) url = s;
  }
  return url && videoId(url) ? url : null;
}

async function convert(blocks, ctx) {
  const out = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];

    // Runs of images become a gallery; a single image spans the width.
    if (b.type === 'image') {
      const run = [];
      while (blocks[i]?.type === 'image') run.push(blocks[i++]);
      const imgs = [];
      for (const img of run) {
        const src = await ctx.image(fileUrl(img.image), img.id);
        if (src) imgs.push(`{% figure src=${attr(src)} alt=${attr(plain(img.image.caption))} /%}`);
      }
      if (imgs.length === 1) out.push(imgs[0]);
      else if (imgs.length) out.push(`{% gallery %}\n${imgs.join('\n')}\n{% /gallery %}`);
      continue;
    }

    // Runs of video links become a row of looping players.
    if (videoUrlOf(b)) {
      const run = [];
      while (blocks[i] && videoUrlOf(blocks[i])) run.push(videoUrlOf(blocks[i++]));
      for (const u of run) await ensurePoster(u);
      const tags = run.map((u) => `{% video url=${attr(u)} /%}`);
      out.push(tags.length === 1 ? tags[0] : `{% videos %}\n${tags.join('\n')}\n{% /videos %}`);
      continue;
    }
    i++;

    const v = b[b.type] || {};
    switch (b.type) {
      case 'paragraph': {
        const s = inline(v.rich_text);
        if (s.trim()) out.push(s);
        break;
      }
      case 'heading_1':
      case 'heading_2':
        out.push(`## ${inline(v.rich_text)}`);
        if (b.children) out.push(await convert(b.children, ctx));
        break;
      case 'heading_3':
        out.push(`### ${inline(v.rich_text)}`);
        if (b.children) out.push(await convert(b.children, ctx));
        break;
      case 'bulleted_list_item':
      case 'numbered_list_item': {
        const mark = b.type === 'bulleted_list_item' ? '-' : '1.';
        const lines = [`${mark} ${inline(v.rich_text)}`];
        // Group consecutive items into one list.
        while (blocks[i]?.type === b.type) lines.push(`${mark} ${inline(blocks[i++][b.type].rich_text)}`);
        out.push(lines.join('\n'));
        break;
      }
      case 'to_do':
        out.push(`- ${inline(v.rich_text)}`);
        break;
      case 'quote':
        out.push(`> ${inline(v.rich_text).replace(/\n/g, '\n> ')}`);
        break;
      case 'callout':
        // Blue callouts are notes to the editor (see the template) and never show.
        if (v.color !== 'blue_background') out.push(`> ${inline(v.rich_text).replace(/\n/g, '\n> ')}`);
        break;
      case 'divider':
        out.push('---');
        break;
      case 'toggle': {
        const title = plain(v.rich_text).trim().toLowerCase();
        if (/^before\s*(and|&|\/)\s*after$/.test(title)) {
          const imgs = (b.children || []).filter((c) => c.type === 'image');
          if (imgs.length >= 2) {
            const before = await ctx.image(fileUrl(imgs[0].image), imgs[0].id);
            const after = await ctx.image(fileUrl(imgs[1].image), imgs[1].id);
            if (before && after) {
              const caption = plain(imgs[1].image.caption) || plain(imgs[0].image.caption);
              out.push(`{% beforeafter before=${attr(before)} after=${attr(after)} caption=${attr(caption)} /%}`);
            }
          }
        } else if (b.children) {
          // Any other toggle: show its title as a subheading and its contents.
          out.push(`### ${inline(v.rich_text)}`, await convert(b.children, ctx));
        }
        break;
      }
      case 'column_list':
      case 'column':
      case 'synced_block':
        if (b.children) out.push(await convert(b.children, ctx));
        break;
      case 'code':
        out.push('```\n' + plain(v.rich_text) + '\n```');
        break;
      default:
        // Tables, files, embeds of other sites and so on are skipped.
        break;
    }
  }
  return out.filter((s) => s && s.trim()).join('\n\n');
}

// ---------------------------------------------------------------------------
// Front matter (a tiny YAML writer: strings are JSON-quoted, which is valid YAML)

function yaml(obj, indent = '') {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
    if (Array.isArray(v)) {
      lines.push(`${indent}${k}:`);
      for (const item of v) {
        if (typeof item === 'object') {
          const inner = yaml(item, `${indent}    `).split('\n');
          lines.push(`${indent}  - ${inner[0].trimStart()}`, ...inner.slice(1));
        } else lines.push(`${indent}  - ${JSON.stringify(item)}`);
      }
    } else if (typeof v === 'object') {
      lines.push(`${indent}${k}:`, yaml(v, `${indent}  `));
    } else lines.push(`${indent}${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------

async function build(kind, page) {
  const title = text(page, 'Title');
  const client = text(page, 'Client');
  const slug = slugify(text(page, 'Slug') || (kind === 'caseStudies' ? client || title : title));
  if (!title || !slug) throw new Error('needs a Title');
  const outDir = OUT[kind];
  const assetDir = path.join(OUT.assets, page.id.replace(/-/g, ''));
  // Paths in the content file are relative to the file itself.
  const rel = (file) => path.relative(outDir, file).split(path.sep).join('/');
  const ctx = {
    async image(url, name) {
      if (!url) return null;
      try {
        return rel(await download(url, assetDir, name.replace(/-/g, '')));
      } catch (e) {
        console.warn(`[notion] "${title}": skipped an image (${e.message})`);
        return null;
      }
    },
  };

  const cover = files(page, 'Cover')[0];
  const coverPath = cover ? await ctx.image(cover, 'cover') : null;
  const body = await convert(await children(page.id), ctx);
  const seo = { seoTitle: text(page, 'SEO title'), seoDescription: text(page, 'SEO description') };

  let data;
  if (kind === 'caseStudies') {
    const heroVideo = text(page, 'Hero video');
    if (heroVideo) await ensurePoster(heroVideo);
    // No cover uploaded: use the hero video's poster.
    let coverRel = coverPath;
    if (!coverRel && heroVideo) {
      const v = videoId(heroVideo);
      const posters = await fs.readdir(OUT.posters).catch(() => []);
      const hit = v && posters.find((f) => f.split('.')[0] === v.id);
      if (hit) coverRel = rel(path.join(OUT.posters, hit));
    }
    if (!coverRel) throw new Error('needs a Cover image or a Hero video');
    const completed = date(page, 'Completed');
    data = {
      title,
      client: client || title,
      category: text(page, 'Category'),
      clientType: text(page, 'Client type'),
      industry: text(page, 'Industry'),
      location: text(page, 'Location'),
      year: num(page, 'Year') ?? new Date(page.created_time).getFullYear(),
      completed: completed ? new Date(completed).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Ongoing',
      services: multi(page, 'Services').map((s) => SERVICE_SLUGS[s]).filter(Boolean),
      summary: text(page, 'Summary') || text(page, 'Intro') || title,
      intro: text(page, 'Intro'),
      cover: coverRel,
      coverVertical: check(page, 'Vertical'),
      videoUrl: heroVideo,
      results: text(page, 'Results')
        .split('\n')
        .map((l) => l.split('|').map((s) => s.trim()))
        .filter(([v]) => v)
        .map(([value, label = '']) => ({ value, label })),
      testimonial: text(page, 'Quote')
        ? { quote: text(page, 'Quote'), person: text(page, 'Quote by'), role: text(page, 'Quote role') }
        : undefined,
      featured: check(page, 'Featured'),
      order: num(page, 'Order') ?? 100,
      ...seo,
    };
  } else {
    data = {
      title,
      excerpt: text(page, 'Excerpt') || text(page, 'SEO description') || title,
      publishedDate: date(page, 'Published date') || page.created_time.slice(0, 10),
      author: text(page, 'Author') || 'Clear Sky Creations',
      cover: coverPath,
      category: text(page, 'Category'),
      tags: multi(page, 'Tags'),
      keyword: text(page, 'Target keyword'),
      ...seo,
    };
  }
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, `${slug}.mdoc`), `---\n${yaml(data)}\n---\n${body}\n`);
  return slug;
}

// ---------------------------------------------------------------------------
// Photos: every published photo becomes a framed Polaroid, tagged with the
// pages (or named carousels) it belongs to. See src/lib/polaroids.ts.

/** Every page on the site, as the path tags used in the Photos database. */
async function sitePaths() {
  const paths = ['/', '/about', '/services', '/work', '/journal', '/contact'];
  const dirs = {
    '/services': ['src/content/services'],
    '/work': ['src/content/case-studies', 'src/content/notion/case-studies'],
    '/journal': ['src/content/posts', 'src/content/notion/posts'],
  };
  for (const [base, list] of Object.entries(dirs)) {
    for (const dir of list) {
      const files = await fs.readdir(path.join(ROOT, dir)).catch(() => []);
      for (const f of files) if (f.endsWith('.mdoc')) paths.push(`${base}/${f.replace(/\.mdoc$/, '')}`);
    }
  }
  return [...new Set(paths)];
}

const TAG_COLOR = { '/services': 'blue', '/work': 'purple', '/journal': 'orange', '/about': 'green', '/': 'yellow' };

// Add any new page to the Photos database's "Pages" options, so a new case
// study, service or post can be picked as soon as it exists. Existing options
// (including custom carousel names) are kept as they are.
async function syncPageTags() {
  const db = await notion('GET', `/databases/${DATABASES.photos}`);
  const existing = db.properties?.Pages?.multi_select?.options || [];
  const have = new Set(existing.map((o) => o.name));
  const missing = (await sitePaths()).filter((p) => !have.has(p));
  if (!missing.length) return;
  const color = (p) => TAG_COLOR['/' + p.split('/')[1]] || 'gray';
  await notion('PATCH', `/databases/${DATABASES.photos}`, {
    properties: { Pages: { multi_select: { options: [...existing, ...missing.map((name) => ({ name, color: color(name) }))] } } },
  });
  console.log(`[notion] Added page tags: ${missing.join(', ')}`);
}

// Keep one Photos row per page, named after its address ("/about",
// "/work/good-stuff-restaurants"), so every page is ready for photos. Rows are
// only ever added, never removed or renamed.
async function ensurePageRows() {
  const rows = await queryPublished(DATABASES.photos, null);
  const named = new Set(rows.map((r) => text(r, 'Name')));
  const missing = (await sitePaths()).filter((p) => !named.has(p));
  for (const p of missing) {
    await notion('POST', '/pages', {
      parent: { database_id: DATABASES.photos },
      properties: { Name: { title: [{ text: { content: p } }] }, Pages: { multi_select: [{ name: p }] } },
    });
  }
  if (missing.length) console.log(`[notion] Added photo rows: ${missing.join(', ')}`);
}

async function syncPhotos() {
  await fs.rm(OUT.polaroids, { recursive: true, force: true });
  await fs.mkdir(OUT.polaroids, { recursive: true });
  // Every row counts (no publish step): a row with photos shows them, an empty
  // row shows nothing, and "Hide" takes a row's photos off the site.
  const rows = (await queryPublished(DATABASES.photos, null)).filter((r) => !check(r, 'Hide'));
  const out = [];
  for (const row of rows) {
    // One row can hold any number of photos: every file in the Photo field,
    // plus any images dropped into the row's page. They all share the row's
    // pages, name and order, and print in the order they appear.
    const name = text(row, 'Description') || 'Clear Sky Creations behind the scenes';
    const pages = multi(row, 'Pages');
    const body = await children(row.id).catch(() => []);
    const urls = [...files(row, 'Photo'), ...body.filter((b) => b.type === 'image').map((b) => fileUrl(b.image))].filter(Boolean);
    if (!urls.length) continue; // no photos yet: that page's carousel stays hidden
    if (!pages.length) {
      console.warn(`[notion] Photo row "${text(row, 'Name')}" has photos but no page; skipped.`);
      continue;
    }
    const id = row.id.replace(/-/g, '');
    const want = text(row, 'Orientation').toLowerCase();
    const order = num(row, 'Order') ?? 100;
    for (const [i, url] of urls.entries()) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`download failed (${res.status})`);
        const file = `${id}-${i + 1}.jpg`;
        const orientation = await framePolaroid(Buffer.from(await res.arrayBuffer()), path.join(OUT.polaroids, file), want);
        out.push({ src: `/polaroids/notion/${file}`, alt: urls.length > 1 ? `${name} (${i + 1})` : name, orientation, pages, order: order + i / 1000 });
      } catch (e) {
        console.warn(`[notion] "${name}" photo ${i + 1} skipped: ${e.message}`);
      }
    }
  }
  await fs.writeFile(OUT.polaroidData, JSON.stringify(out, null, 2) + '\n');
  console.log(`[notion] Photos: ${out.length} Polaroid${out.length === 1 ? '' : 's'}`);
}

export async function main() {
  if (!TOKEN) {
    console.log('[notion] NOTION_TOKEN not set; skipping the Notion sync.');
    return;
  }
  // Start clean so unpublished pages disappear from the site.
  await Promise.all([OUT.caseStudies, OUT.posts, OUT.assets].map((d) => fs.rm(d, { recursive: true, force: true })));
  for (const kind of ['caseStudies', 'posts']) {
    const pages = await queryPublished(DATABASES[kind]);
    const seen = new Set();
    for (const page of pages) {
      const name = text(page, 'Title') || page.id;
      try {
        const slug = await build(kind, page);
        if (seen.has(slug)) console.warn(`[notion] Two ${kind} pages share the address "${slug}"; the later one wins.`);
        seen.add(slug);
        console.log(`[notion] ${kind === 'posts' ? 'Journal' : 'Case study'}: ${name} -> ${slug}`);
      } catch (e) {
        // One broken page never stops the build; it just stays off the site.
        console.warn(`[notion] Skipped "${name}": ${e.message}`);
      }
    }
  }
  // After the pages above, so brand-new pages get their tag on the same build.
  await syncPageTags().catch((e) => console.warn(`[notion] Couldn't update page tags: ${e.message}`));
  await ensurePageRows().catch((e) => console.warn(`[notion] Couldn't add photo rows: ${e.message}`));
  await syncPhotos().catch((e) => console.warn(`[notion] Photos skipped: ${e.message}`));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    // A Notion outage shouldn't take the site down: build with what's in the repo.
    console.error(`[notion] Sync failed, building without Notion content: ${e.message}`);
  });
}
