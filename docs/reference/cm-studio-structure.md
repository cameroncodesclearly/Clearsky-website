# cm.studio structure reference

Captured 2026-10-14 from https://www.cm.studio with headless Chromium (CDP) and
`rea-agents@6.4.0` (`list-browser-targets`, `inspect-web-page`). Desktop 1440x900 and
mobile 390x844, scrolled through every section. REA evidence per page is in
`docs/reference/rea/*.json` (DOM size, custom elements, scripts, resources).
Screenshots were kept out of the repo because they contain cm.studio's and its
clients' imagery.

Use this for layout, section order, and motion only. Nothing here (text, images,
animation files, code) is copied into the Clear Sky site.

## Stack observed

- Astro static site on Vercel, content from DatoCMS, video from Mux (HLS).
- Every interactive block is a custom element (`six-*`) with a small script.
- Motion: GSAP (ScrollTrigger, MotionPath), Locomotive smooth scroll, Swiper, Barba-style page transitions, Lottie (`.lottie`) player.
- Type: a heavy condensed sans (Druk-like) for display, a geometric grotesk (Millie) for UI and body, a light high-contrast serif for project titles.
- Palette: warm off-white `#f5f4ee`-ish page, near-black text, one saturated blue (`#0081ff`) used for doodles and the footer CTA, orange nav text on blue.

## Unique pages

| cm.studio URL | Page type | Clear Sky equivalent |
|---|---|---|
| `/` | Home | `/` |
| `/projects` | Work index + archive table | `/work/` |
| `/projects/<slug>` | Project detail | `/work/<slug>/` |
| `/about` | About | `/about/` |
| `/labels/<slug>` (5 labels + studio rental) | Capability / label page | `/services/<slug>/` plus `/services/` index |
| any unknown URL | 404 | `/404` |

Contact is a `mailto:` link on cm.studio. Clear Sky adds `/contact/` (live intake
form) and `/journal/` + `/journal/<slug>/` (blog), styled with the same system.

## Global chrome (every page)

- **Preloader** (`six-preloader`): first visit per session only (sessionStorage). Full-screen, cycles shuffled status words ("LOADING...", "THINKING..."), waits for hero media, 5 s failsafe.
- **Header** (`six-header`): wordmark left; four nav items spread on a grid (Work, About, Services, Contact); mute toggle at far right. Fixed, transparent, text colour inverts over dark hero video. **Services** opens a dropdown panel listing the labels in small bold caps; the page behind fades to ~20% opacity.
- **Mobile**: wordmark + "MENU" text button opening a full-screen menu.
- **Custom cursor** (`six-custom-cursor`): small follower (`gsap.quickTo`, 0.1 s); over media it shows a label pill ("Pick our brains!") or a mini media slider.
- **Page transition** (`six-page-fader`): full-screen fade, 0.66 s `expo.out`, 0.25 s delay on enter.
- **Footer CTA** (`six-footer`): full-bleed saturated blue. A hand-drawn doodle character (scribble head, line-boil animation) above a centred, very bold sans line: "IT'S [live clock pill], DO YOU KNOW WHERE YOUR MIND IS?" The clock (`six-clock`) updates every second with a blinking colon. Small dark "GET IN TOUCH" pill.
- **Footer bar**: one row of tiny caps links (copyright, Instagram, LinkedIn, News, Email, credit), then the wordmark set edge to edge at full viewport width.

## Home (`/`), 7,732 px at 1440

1. **Hero project carousel** (`six-project-carousel`): full-bleed autoplaying muted video of a featured project. Bottom-left: client in condensed caps over project title in light serif. Bottom-right: row of 5 small video thumbnails acting as progress/tabs. On scroll, the hero scales to 0.9 and its corners round to 80 px (scrubbed ScrollTrigger), so it becomes a card the page slides over.
2. **Credential callout**: centred lockup "Ad Age | Small Agency of the Year" with a vertical rule, small blue doodles (sparkle, smiley), caption "OVERALL GOLD WINNER 2026" in serif caps. Lots of white space.
3. **Brain callout** (`six-brain-callout`): see the dedicated section below.
4. **Project feed**: single column of cards that alternate left / right / centre, mixing portrait (9:16) and landscape media. Each card has a two-line caption above it (CLIENT in bold caps, category in grey caps). Videos autoplay in view. Generous vertical gaps (around 200 px).
5. **Client logo marquee** (`six-marquee`): one row of monochrome logos scrolling left at a constant speed (duration = width / 75 px per s), paused when off screen.
6. **Manifesto**: three huge condensed lines ("STORY DRIVEN / CULTURE OBSESSED / ALWAYS CURIOUS"). On mobile each line is split by a small image or doodle (two heads, a 3D brain).
7. **Footer CTA + footer** (global).

## Work index (`/projects`), 3,830 px

1. Three-column grid of project cards. Caption above each card (CLIENT / project title in grey caps), media 16:10 with ~12 px radius, video on hover. Large row gaps.
2. **Archive** heading (light weight, ~40 px), then a full-width table: Client name, Project title, Year, Services (comma list in caps). Thin rules between rows, tiny caps type. "LOAD MORE" pill below.
3. Footer.

## Project detail (`/projects/<slug>`), 4,980 px

The whole page takes the project's own background colour (purple for the Yahoo piece).
1. **Header** (`six-project-header`): centred client in condensed caps over title in light serif.
2. **Hero video** in a large rounded card (radius ~40 px) with full controls (Mux media-chrome), expanding to full-bleed on scroll.
3. **Meta row**: 6 small label/value pairs (Client, Location, Year, Role, Category...).
4. **Intro statement**: large (~36 px) medium-weight paragraph, max ~22 words per line, centred column.
5. Short body paragraph in small type, offset right.
6. **Media grid**: mixed rows of 3 portrait stills/videos, then 2 landscape, rounded corners.
7. **More Projects**: horizontal row of 6 cards of varied aspect ratios with caption above, a small arrow at the end.
8. Footer (the CTA keeps the project colour).

## About (`/about`), 6,304 px

1. **Statement**: very large condensed caps, centred, 3 lines ("AN INDEPENDENT CREATIVE AGENCY CONNECTING BRANDS TO HUMANS SINCE 2008.").
2. **Reel card**: black rounded card with an animated wordmark/video; grows to full width on scroll.
3. **Positioning paragraph**: ~28 px medium sans, left-aligned in a centred column, two paragraphs.
4. **"MAKE IT MATTER"** (`six-scattered-labels`): huge two-line caps; small label cards (logo tile + caption) scatter across and over the type as you scroll.
5. **Team photo carousel**: numbered (01 to 06) row of portrait photos with varied heights, arrow at end.
6. **Offices**: light serif "Offices in Los Angeles, CA & Portland, OR.", two building photos with address / phone in tiny caps.
7. Footer.

## Label page (`/labels/<slug>`), 6,372 px

1. **Hero** (`six-single-label-header`): full-bleed video, label logo centred, tiny caption at the bottom ("CREATOR & INFLUENCER PARTNERSHIPS").
2. Hero collapses into a rounded card on scroll (same scale + radius trick).
3. **Intro**: ~28 px sentence with the label name in grey.
4. **Numbered media carousel** (01 to 06+), portrait videos.
5. **Big statement** in condensed caps, centred.
6. **Floating media collage**: portrait and landscape videos placed loosely at different offsets.
7. **Capabilities**: tiny "CAPABILITIES" caption, then the list set as one block of condensed caps.
8. **Featured project** full-width video card.
9. **"LET'S WORK."** CTA: huge caps with a blue doodle (speech bubbles) overlapping the type, "GET IN TOUCH" pill.
10. Footer.

The studio-rental variant swaps the collage for a plain spec list and pricing in medium sans.

## 404

Full-screen saturated blue, header on top, a small rounded square showing a random meme video, and a huge condensed headline bottom-left that scrambles through random strings ("ERROR 404...", "PAGE NOT FOUHCDTI").

## The brain section (homepage)

**Layout.** Centred headline in the heavy condensed face, three lines, about 180 px cap height at 1440 wide ("EVERYONE COULD USE A SECOND BRAIN"). The animated brain sits centred below and overlaps the bottom of the last line by about a third of its height, so the drawing reads as part of the type. About 280 x 160 px at 1440. Plenty of empty off-white space below before the project feed.

**Animation file.** `/brainOrganic.lottie` (dotLottie zip, 96 KB) holding one Lottie JSON:
- 1000 x 1000 canvas, **7 fps, 7 frames**, so the loop is exactly 1 s.
- 7 layers, each visible for one frame (`ip = n`, `op = n + 1`). This is a hand-drawn **line boil**: the same scribble redrawn seven times with small differences, played on twos, so the line wobbles and breathes. There is no draw-on, trim path, or tweening.
- Each frame is a set of filled outline shapes (about 100 paths per frame, merged with Merge Paths), meaning a marker stroke that has been expanded to outlines. Fills only, no strokes in the file.
- One flat colour for everything: RGB(0, 129, 255), `#0081FF`. No gradients, shading, or texture apart from the slightly uneven marker edge.

**Line character.** One continuous, looping scribble (like a phone cord pulled into a cloud shape) with round ends and round joins. The line is fat: about 5% of the drawing's width, roughly 14 px on a 280 px wide drawing. Loops overlap and cross freely. The edge is a little irregular, as if drawn with a felt marker.

**Interaction.**
- Hovering shows the custom cursor label "Pick our brains!" (on mobile the label fades up when the section enters the viewport).
- Clicking spawns a short quote in a pill (off-white fill, 1 px grey border, small sans text). The pill follows one of several hidden SVG motion paths around the brain: it starts at scale 0.4 with a 1.5 em blur, glides in over 2.5 s (`power2.out`) while unblurring, holds for 0.8 to 2.5 s depending on length, then drifts off along the same path and blurs out (1.5 s, `power2.in`). At most five pills are on screen; the oldest is removed first.
- Each click also plays a random note from a pentatonic set (C4 D4 E4 G4 A4 C5 D5 E5) on a sine synth with reverb, at -12 dB.

**Same style elsewhere on the site.** The doodle character in the footer CTA, the speech bubbles on label pages, and the small sparkle and smiley marks all use the same single-colour, fat round-capped marker line with a jittery boil. That consistency is a big part of the look.

## Motion summary

| Pattern | Where | Detail |
|---|---|---|
| Hero to card | Home hero, label hero, about reel | ScrollTrigger scrub: scale 1 to 0.9, radius 0 to 80 px over the first half viewport |
| Line boil doodles | Brain, footer character, CTA bubbles | 7 hand-drawn frames at 7 fps, single colour |
| Blur-in pills on paths | Brain clicks | scale 0.4 to 1, blur 1.5 em to 0, path motion, then reverse |
| Marquee | Client logos | CSS keyframes, speed tied to width, paused off screen |
| Live clock | Footer CTA | 1 s interval, blinking colon |
| Page fade | Navigation | 0.66 s expo.out |
| Cursor label | Media and brain | Follows pointer with a 0.1 s lag |
| Preloader | First visit | Shuffled status words, waits on hero media |

## Translation rules for Clear Sky

- Keep the bones: off-white page, giant condensed display caps, small bold caps UI text, one saturated accent colour for doodles and the footer CTA, rounded media cards, alternating feed.
- Swap the type: Stapelia Hirsuta Sans for display, Poppins SemiBold for UI and H2, Stapelia Script as the serif-title stand-in for flourishes.
- Swap the colour: Clear Sky dark blue `#1a5276` takes the role of cm's blue; mustard `#d9b435` is the second doodle colour (the sun rays from the logo); text stays near-black `#1a1307` on off-white `#f1f2f4`.
- Brain to Breeze: "We make content creation a breeze" with an original line-boil drawing of wind gusts curling around a cloud, drawn in the same fat round marker line as the Clear Sky logo, 7 frames at 7 fps, one colour plus a mustard accent. Clicking sends short Clear Sky notes along the gusts with a soft chime.
