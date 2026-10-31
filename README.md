# Clear Sky Creations website

Astro static site with a Keystatic editor. Layout and motion follow the structure of
cm.studio (see `docs/reference/cm-studio-structure.md`); all code, copy, artwork, and
media are Clear Sky's own.

## Run it

```sh
npm ci
npm run dev        # http://localhost:4321, editor at http://localhost:4321/keystatic
npm run build
```

## Editing content

Open `/keystatic`. Locally it edits files on disk. On the deployed site it commits to
GitHub once the Keystatic GitHub App is connected (visit `/keystatic` on the live site
and follow the prompt, then add the `KEYSTATIC_*` values from `.env.example` in Vercel).

| What | Where in Keystatic | Files |
|---|---|---|
| Case studies | Work > Case Studies | `src/content/case-studies/*.mdoc` |
| Service pages | Services | `src/content/services/*.mdoc` |
| Journal posts | Journal | `src/content/posts/*.mdoc` |
| Homepage hero reel, sunrise headline, manifesto, client logos | Site > Homepage | `src/content/settings/home.json` |
| About page | Site > About page | `src/content/settings/about.json` |
| Email, phone, socials, intake form ID | Site > Site settings | `src/content/settings/site.json` |

**Adding a case study:** create an entry, add a cover image, paste the Vimeo or YouTube
link for the hero video, and tick "Feature on homepage" to put it in the homepage feed
and hero. Private Vimeo links keep their hash (`vimeo.com/123456/abcdef`). Pick a page
colour to theme the whole case study page.

**Video posters:** stills saved as `src/assets/video-posters/<vimeo id>.jpg` are used
automatically for that video. Players only appear once Vimeo confirms the video is
playing, so a private or domain-locked video quietly falls back to its poster.

**Draft** entries stay editable but never reach the public site.

## Brand rules in code

- No em-dashes anywhere in copy.
- Display type: Stapelia Hirsuta Sans (caps). Flourishes: Stapelia Hirsuta Script.
  UI and body: Poppins. Fonts live in `public/fonts`.
- Colours are tokens in `src/styles/global.css`. Page themes: paper, blue, sky, butter, ink.
- Mustard and light blue are never used for body text on off-white (contrast).

## Sky, sun and film grain

- **Sky backdrop** (`src/components/SkyBackdrop.astro`, `src/scripts/sky.ts`): light pages
  sit on a fixed pastel sky photo with a few clouds drifting past at different depths.
  From about halfway down the page the sky and clouds turn pink, deepening into the
  footer's beach sunset: a 10 second seamless loop of Redondo Beach made in Higgsfield
  (Kling 3.0, same first and last frame), in `public/sky/beach-sunset*` as WebM and MP4
  with a still poster. "no matter how beautiful" is set in Caveat Brush with an SVG chalk
  filter that re-draws at 7 fps (the cm.studio line boil).
  Images are in `public/sky/`, cut from CC0 photos on Wikimedia Commons
  (BlueSkyWhiteClouds21 by Raysonho, Clouds 07 by Shams948).
- **Live weather** (`src/pages/api/sky.ts`, `src/scripts/weather.ts`): on the homepage the
  open sky between the hero and the headline shows the visitor's weather (clear, partly
  cloudy, overcast, rain, storm, snow, fog) and time of day (morning, afternoon, sunset,
  night), then clears as the sun rises. Location comes from Vercel's IP headers (no
  permission prompt), weather from MET Norway (free for commercial use, credited in the
  footer), time of day from the sun's real elevation there. Results are cached 15 minutes.
  Preview any look with `/?sky=storm&phase=night`. Anything failing falls back to the
  normal pastel sky.
- **Sunrise** (`src/components/SunRise.astro`, `src/scripts/sunrise.ts`, `Breeze.astro`):
  the homepage headline scrolls in and locks mid-screen for about 1.6 screens of scrolling
  (`.breeze__rise` height). While it is held the live weather clears (first 40%) and the
  sun rises from below the screen to sit above it (15% to 90%). All CSS scroll-driven
  animations on the `--rise` view timeline, with a JS fallback. Keep `overflow: clip`,
  not `hidden`, on the section or the pin and timeline break. Sun size is `--d`.
- **Film grain** (`src/components/FilmGrain.astro`): 24 fps grain and a faint flicker over
  type, the sky and animation. The grain tile is generated in the browser at the screen's
  pixel density (no image file). Work, video and photos (anything in a `.frame`, plus the
  hero) sit above it, and case study pages turn it off (`grain={false}`). Strength is
  `--grain` in `src/styles/global.css`. Reduced motion freezes it.

## The glass loop

The gold glass animation (loading screen only) lives in
`public/glass/`: transparent WebM for most browsers, animated WebP for Safari and iOS,
and a still poster for reduced motion. It was converted from a 142-frame .lottie. To
replace it, export new frames and re-encode at the same file names (480 px WebM, 400 px
WebP).

## The line-boil doodles

`scripts/make-breeze-lottie.mjs` generates the line-boil doodles in `public/lottie/`
(breeze, sky, bubble) and `src/lib/breeze-paths.json` (the gust paths notes travel
along). Edit the point lists in that script and run `node scripts/make-breeze-lottie.mjs`.

## Deploying

Preview: Vercel (project `clearsky-website`). The Vercel Hobby plan is for
non-commercial use; move to Vercel Pro or Cloudflare Pages before launch.
