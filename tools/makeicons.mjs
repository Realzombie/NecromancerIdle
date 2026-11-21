// Generates the PWA icons (icons/icon-192.png, icons/icon-512.png): node tools/makeicons.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
fs.mkdirSync(out, { recursive: true });

const palette = { G: '#7fa86a', g: '#5f8a52', E: '#e8e0a0', B: '#5a4a6a', D: '#3a2f48', R: '#a04848' };
const grid = [
  '..gGGGg.', '.gGGGGGg', '.GEGGEGG', '.GGGRGG.', '..GGGG..', 'GBBBBBB.',
  'GBBBBBBG', '.BBBBBB.', '.BBDDBB.', '.GG..GG.', '.DD..DD.',
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const px = Buffer.alloc(size * size * 4);
  const bg = hex('#14101c');
  for (let i = 0; i < size * size; i++) { px[i * 4] = bg[0]; px[i * 4 + 1] = bg[1]; px[i * 4 + 2] = bg[2]; px[i * 4 + 3] = 255; }
  // Keep the sprite inside the maskable safe zone (centre 60%).
  const cell = Math.floor((size * 0.6) / grid.length);
  const w = grid[0].length * cell, h = grid.length * cell;
  const ox = Math.floor((size - w) / 2), oy = Math.floor((size - h) / 2);
  grid.forEach((row, gy) => [...row].forEach((ch, gx) => {
    if (ch === '.') return;
    const [r, g, b] = hex(palette[ch]);
    for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
      const i = ((oy + gy * cell + y) * size + ox + gx * cell + x) * 4;
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
  }));
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const s of [192, 512]) fs.writeFileSync(path.join(out, `icon-${s}.png`), makePng(s));
console.log('icons written to', out);
