/**
 * Ilova ikonkalarini yasaydi (yashil fon + oq feya).
 *
 * NEGA RASM KUTUBXONASISIZ: ikonka oddiy geometrik shakllardan iborat,
 * shuning uchun har piksel analitik tekshiruv bilan bo'yaladi. PNG esa
 * Node'ning ichki `zlib` moduli bilan kodlanadi. Doimiy bog'liqlik
 * saqlash o'rniga bir martalik skript — natija repoga commit qilinadi.
 *
 * Ishga tushirish:  node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const GREEN = [16, 185, 129, 255] // #10b981
const WHITE = [255, 255, 255, 255]

/* ---------------------------- PNG kodlash ---------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))

  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(size, pixels) {
  // Har qator oldiga filtr bayti (0 — filtrsiz) qo'yiladi
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit chuqurligi
  ihdr[9] = 6 // rang turi: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------ Shakllar ------------------------------ */

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r

/** Uchburchak ichidami — barisentrik belgi testi */
function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry)

  const d1 = sign(x, y, ax, ay, bx, by)
  const d2 = sign(x, y, bx, by, cx, cy)
  const d3 = sign(x, y, cx, cy, ax, ay)

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0

  return !(hasNeg && hasPos)
}

/** Yumaloq kvadrat — burchak radiusi ulushda */
function inRoundedSquare(x, y, radius) {
  if (x >= radius && x <= 1 - radius) return y >= 0 && y <= 1
  if (y >= radius && y <= 1 - radius) return x >= 0 && x <= 1

  const cx = x < 0.5 ? radius : 1 - radius
  const cy = y < 0.5 ? radius : 1 - radius
  return inCircle(x, y, cx, cy, radius)
}

/** Burchakka burilgan ellips — qanotlar yotiq emas, qiya turadi */
function inRotatedEllipse(x, y, cx, cy, rx, ry, degrees) {
  const rad = (degrees * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  const rotX = dx * Math.cos(rad) + dy * Math.sin(rad)
  const rotY = -dx * Math.sin(rad) + dy * Math.cos(rad)

  return (rotX / rx) ** 2 + (rotY / ry) ** 2 <= 1
}

/**
 * Feya silueti ichidami (normallashtirilgan 0..1 koordinatalar,
 * `scale` — markazga nisbatan kichraytirish).
 *
 * NEGA SILUET, NEGA 3D RENDER EMAS: ikonka 48px gacha kichrayadi (brauzer
 * yorlig'i, telefon ekrani). Tafsilotli render u yerda loyqa dog'ga
 * aylanadi — sinab ko'rilgan. Sodda va qalin shakl har o'lchamda o'qiladi.
 */
function fairyAt(x, y, scale) {
  // Markazga nisbatan masshtablash
  const px = (x - 0.5) / scale + 0.5
  const py = (y - 0.5) / scale + 0.5

  // Qanotlar YUQORIGA qiya — pastga qaragan simmetrik dog'lar gulbargga
  // o'xshab qolardi
  // Bitta juft: to'rtta qanot 48px da shaklsiz dog'ga aylanardi
  const wings =
    inRotatedEllipse(px, py, 0.26, 0.42, 0.235, 0.125, -38) ||
    inRotatedEllipse(px, py, 0.74, 0.42, 0.235, 0.125, 38)

  const head = inCircle(px, py, 0.5, 0.19, 0.1)
  // Tana ikki qismdan: ingichka bel va keng ko'ylak — "poya" bo'lib
  // ko'rinmasligi uchun
  const torso = inTriangle(px, py, [0.5, 0.27], [0.435, 0.56], [0.565, 0.56])
  const skirt = inTriangle(px, py, [0.5, 0.45], [0.34, 0.82], [0.66, 0.82])
  // Qo'llar — odam siluetini beradi
  const arms =
    inRotatedEllipse(px, py, 0.4, 0.4, 0.085, 0.028, 28) ||
    inRotatedEllipse(px, py, 0.6, 0.4, 0.085, 0.028, -28)
  // Sehr yulduzi — "feya" ekanini bir qarashda aytadi
  const star =
    inRotatedEllipse(px, py, 0.82, 0.15, 0.085, 0.022, 0) ||
    inRotatedEllipse(px, py, 0.82, 0.15, 0.085, 0.022, 90)

  const body = head || torso || skirt || arms

  if (!wings && !body && !star) return null

  // Tana chekkasi fon rangida "o'yiladi": aks holda tana va qanotlar
  // qo'shilib bitta shaklsiz dog' bo'lib qolardi
  const pad = 0.024
  const bodyEdge =
    !body &&
    (inCircle(px, py, 0.5, 0.19, 0.1 + pad) ||
      inTriangle(px, py, [0.5, 0.25], [0.415, 0.575], [0.585, 0.575]) ||
      inTriangle(px, py, [0.5, 0.425], [0.32, 0.845], [0.68, 0.845]) ||
      inRotatedEllipse(px, py, 0.4, 0.4, 0.085 + pad, 0.028 + pad, 28) ||
      inRotatedEllipse(px, py, 0.6, 0.4, 0.085 + pad, 0.028 + pad, -28))

  return bodyEdge ? GREEN : WHITE
}

/* ------------------------------ Chizish ------------------------------ */

/**
 * @param size   piksel o'lchami
 * @param scale  feya kattaligi (maskable uchun kichikroq: Android
 *               ikonkani doiraga qirqadi, chekkadagi tasvir kesilib qoladi)
 * @param rounded burchaklar yumaloqlanadimi (maskable — to'la kvadrat)
 */
function drawIcon(size, { scale = 1, rounded = true } = {}) {
  const pixels = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size
      const ny = (y + 0.5) / size
      const offset = (y * size + x) * 4

      const insideBackground = rounded ? inRoundedSquare(nx, ny, 0.22) : true
      if (!insideBackground) continue // shaffof qoladi

      const color = fairyAt(nx, ny, scale) ?? GREEN
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = color[3]
    }
  }

  return encodePng(size, pixels)
}

const OUTPUTS = [
  ['public/icon-192.png', 192, { scale: 1 }],
  ['public/icon-512.png', 512, { scale: 1 }],
  // Maskable: tasvir markazdagi xavfsiz hududda turishi kerak
  ['public/icon-maskable-512.png', 512, { scale: 0.72, rounded: false }],
  ['public/apple-touch-icon.png', 180, { scale: 1, rounded: false }],
]

for (const [file, size, options] of OUTPUTS) {
  writeFileSync(file, drawIcon(size, options))
  console.log(`${file} — ${size}×${size}`)
}
