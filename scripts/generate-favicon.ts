import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const SRC = 'public/winemp.png';
const OUT = 'public';

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

await mkdir(OUT, { recursive: true });

for (const { name, size } of sizes) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(`${OUT}/${name}`);
  console.log(`✓ ${name} (${size}x${size})`);
}

// Generate favicon.ico (multi-size)
await sharp(SRC)
  .resize(48, 48, { fit: 'cover' })
  .png()
  .toFile(`${OUT}/favicon-48x48.png`);

const ico48 = await sharp(`${OUT}/favicon-48x48.png`).png().toBuffer();
const ico32 = await sharp(SRC).resize(32, 32, { fit: 'cover' }).png().toBuffer();
const ico16 = await sharp(SRC).resize(16, 16, { fit: 'cover' }).png().toBuffer();

// Simple ICO generator (concat PNGs as directory entries)
function createIco(pngs: Buffer[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4); // count

  let offset = 6 + pngs.length * 16;
  const entries: Buffer[] = [];

  for (const [i, png] of pngs.entries()) {
    const entry = Buffer.alloc(16);
    const sizes = [16, 32, 48];
    entry.writeUInt8(sizes[i] || 32, 0);
    entry.writeUInt8(0, 1); // colors
    entry.writeUInt16LE(0, 2); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(png.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngs]);
}

const ico = createIco([ico16, ico32, ico48]);
const { writeFileSync } = await import('fs');
writeFileSync(`${OUT}/favicon.ico`, ico);
console.log(`✓ favicon.ico (multi-size)`);

// Cleanup temp
import { unlink } from 'fs/promises';
await unlink(`${OUT}/favicon-48x48.png`).catch(() => {});
console.log('Done!');
