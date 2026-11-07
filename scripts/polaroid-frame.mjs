// Turns any photo into a Polaroid print matching the approved camera-carousel
// prints exactly (public/polaroids/*.jpg): cream card, 27px border, 91px lip
// at the bottom, hairline edge. The photo is cropped to the window around its
// most interesting area (faces, detail), so any upload works.
//
//   node scripts/polaroid-frame.mjs <photo> [out.jpg] [portrait|landscape]
import sharp from 'sharp';

const CARD = { portrait: { w: 490, h: 700 }, landscape: { w: 700, h: 548 } };
const BORDER = 27, LIP = 91;
const PAPER = { r: 249, g: 247, b: 241 };

/** Frame `input` (a path or Buffer) and write a JPEG to `out`. Returns the orientation used. */
export async function framePolaroid(input, out, orientation) {
  const img = sharp(input, { failOn: 'none' }).rotate(); // respect phone EXIF rotation
  const meta = await img.metadata();
  const sideways = (meta.orientation || 1) >= 5;
  const w = sideways ? meta.height : meta.width, h = sideways ? meta.width : meta.height;
  const o = orientation === 'portrait' || orientation === 'landscape' ? orientation : w > h ? 'landscape' : 'portrait';
  const card = CARD[o];
  const win = { w: card.w - BORDER * 2, h: card.h - BORDER - LIP };
  // Twice the size, so prints stay sharp on high-density screens.
  const s = 2;
  const photo = await img
    .resize(win.w * s, win.h * s, { fit: 'cover', position: sharp.strategy.attention })
    .toBuffer();
  const edge = Buffer.from(
    `<svg width="${card.w * s}" height="${card.h * s}"><rect x="1" y="1" width="${card.w * s - 2}" height="${card.h * s - 2}" fill="none" stroke="rgb(231,228,220)" stroke-width="2"/></svg>`,
  );
  await sharp({ create: { width: card.w * s, height: card.h * s, channels: 3, background: PAPER } })
    .composite([{ input: photo, left: BORDER * s, top: BORDER * s }, { input: edge }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  return o;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , input, out = input.replace(/\.\w+$/, '') + '-polaroid.jpg', o] = process.argv;
  if (!input) {
    console.log('Usage: node scripts/polaroid-frame.mjs <photo> [out.jpg] [portrait|landscape]');
    process.exit(1);
  }
  framePolaroid(input, out, o).then((used) => console.log(`${out} (${used})`));
}
