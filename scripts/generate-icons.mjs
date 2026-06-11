// Generates the PWA PNG icons with zero dependencies (Node's zlib only).
// Draws a dark rounded tile + accent circle + white play triangle (reels = video).
// Re-run via `npm run icons` (also runs automatically before `npm run build`).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

const BG = [15, 15, 18] // #0f0f12
const ACCENT = [124, 92, 255] // #7c5cff
const WHITE = [255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(size, pixels) {
  // pixels: Uint8Array RGBA, length size*size*4
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // raw with per-scanline filter byte 0
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    pixels.copy
      ? pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, y * size * 4 + size * 4)
      : raw.set(pixels.subarray(y * size * 4, y * size * 4 + size * 4), y * (size * 4 + 1) + 1)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// signed area sign for point-in-triangle test
function sign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by)
}

function draw(size, { padding = 0 } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const r = size * (0.22 - padding * 0.0) // corner radius for rounded tile
  const cornerR = size * 0.22
  const cx = size / 2
  const cy = size / 2
  const circleR = size * (0.34 - padding) // accent circle radius
  // play triangle vertices (pointing right), centered
  const t = size * (0.16 - padding * 0.5)
  const ax = cx - t * 0.8,
    ay = cy - t
  const bx = cx - t * 0.8,
    by = cy + t
  const dx = cx + t,
    dy = cy

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = [0, 0, 0]
      let a = 0

      // rounded-rect background (full bleed, with rounded corners)
      const inX = Math.min(x, size - 1 - x)
      const inY = Math.min(y, size - 1 - y)
      let inside = true
      if (inX < cornerR && inY < cornerR) {
        const ddx = cornerR - inX
        const ddy = cornerR - inY
        inside = ddx * ddx + ddy * ddy <= cornerR * cornerR
      }
      if (inside) {
        col = BG
        a = 255
      }

      if (a > 0) {
        // accent circle
        const dxc = x - cx + 0.5
        const dyc = y - cy + 0.5
        if (dxc * dxc + dyc * dyc <= circleR * circleR) {
          col = ACCENT
        }
        // play triangle
        const d1 = sign(x, y, ax, ay, bx, by)
        const d2 = sign(x, y, bx, by, dx, dy)
        const d3 = sign(x, y, dx, dy, ax, ay)
        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0
        if (!(hasNeg && hasPos)) {
          col = WHITE
        }
      }

      const i = (y * size + x) * 4
      px[i] = col[0]
      px[i + 1] = col[1]
      px[i + 2] = col[2]
      px[i + 3] = a
    }
  }
  void r
  return encodePNG(size, px)
}

const targets = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  // maskable needs safe-zone padding so the circle isn't clipped by mask shapes
  { name: 'maskable-512.png', size: 512, padding: 0.06 },
]

for (const t of targets) {
  writeFileSync(resolve(outDir, t.name), draw(t.size, { padding: t.padding }))
  console.log('wrote', t.name)
}

// apple-touch-icon (iOS uses this; must be PNG, opaque background)
writeFileSync(resolve(__dirname, '../public/apple-touch-icon.png'), draw(180, { padding: 0 }))
console.log('wrote apple-touch-icon.png')
