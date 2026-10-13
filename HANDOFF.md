# Clear Sky website: session handoff

## Goal
Rebuild the page structure of https://www.cm.studio (unique pages only) as an
original site for Clear Sky Creations. Use cm.studio for layout, section order,
and motion patterns only. Write original code and copy, and use Clear Sky
assets. Do not copy cm.studio text, images, or animation files.

Requirements from Cameron:
- Video assets from Drive "03_Final Exports" (1ZMwn44hckVNcZAIUHiWzvxLpaziA01um).
- Case studies from clearskycreations.com, plus newer projects in Drive
  "01_Working Projects" (1-SXtDy8CiTIs8-ZizwVxtBKKEcQkUSrZ). Use an asset only
  after the Notion PM database confirms it is final (see docs/discovery/).
- Case studies and blog posts must be easy to add (Keystatic editor at /keystatic).
- Replace cm.studio's homepage "brain" section with "We make content creation a breeze".
- The breeze animation must reflect the visual style of cm.studio's brain
  animation (look, line weight, palette treatment, motion feel) as ORIGINAL artwork.
  The current public/lottie/breeze.json is a placeholder made before
  cm.studio could be seen. Regenerate it with scripts/make-breeze-lottie.mjs once the style is known.
- About page and copy inspiration from clearskycreations.com.
- Brand voice: no em-dashes anywhere. See docs/discovery/brand.json.

## Stack (decided)
- Astro 7 static site, Keystatic git-based CMS (content in src/content/*), Markdoc.
- Preview on Vercel. For production, Cloudflare Pages is recommended (free for
  commercial use; Vercel Hobby is non-commercial only).
- Large videos: short web loops (<8 MB) in public/videos; full pieces via a URL
  field (YouTube/Vimeo/R2). The Drive connector can't move files of 60 to 400 MB into the container.

## Blocked in session 1
- Network policy denied cm.studio, clearskycreations.com, lottiefiles.com.
  REA ran (`rea list-browser-targets`) but Chrome got a proxy refusal.
- GitHub integration could not create the repo; Cameron creates it manually.

## Next session: REA capture plan for cm.studio
1. `chromium --headless=new --remote-debugging-port=9222 --proxy-server="$HTTPS_PROXY" https://www.cm.studio`
2. `npx rea-agents@6.4.0 list-browser-targets http://127.0.0.1:9222 --json`
3. Per unique page: `rea inspect-web-page` (DOM + resources) and
   `rea capture-web-screenshot` at desktop and mobile widths, scrolling through every section.
4. Brain section: capture a frame sequence (screenshots every ~150 ms) and
   inspect its animation resource (Lottie JSON, video, canvas, or CSS) to
   describe the style. Then author an original Clear Sky animation in that style.
5. Write docs/reference/cm-studio-structure.md: page list, section order, layout patterns, motion.
6. Pull current case studies and About copy from clearskycreations.com.

## Status
- [x] Brand system (docs/discovery/brand.json)
- [x] Astro + Keystatic scaffold, content schema, design tokens, base layout
- [x] Placeholder breeze Lottie generator (to be restyled)
- [ ] Discovery: copy, case studies, Drive inventory, Notion final-status checks (docs/discovery/)
- [ ] cm.studio structure capture with REA
- [ ] Pages: home, work, case study, services, about, journal, post, contact, 404
- [ ] Videos: transcode verified finals to web loops
- [ ] Vercel preview
