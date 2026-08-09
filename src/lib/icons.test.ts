import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Kutilgan ikonkalar va ularning o'lchamlari */
const ICONS = [
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'public/icon-maskable-512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
]

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe.each(ICONS)('$file', ({ file, size }) => {
  it('mavjud va haqiqiy PNG', () => {
    expect(existsSync(file)).toBe(true)

    const data = readFileSync(file)
    expect(data.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
  })

  it('o‘lchami kutilganday', () => {
    // IHDR bo'limi: 8 bayt imzo + 4 uzunlik + 4 tur, keyin en/bo'y
    const data = readFileSync(file)

    expect(data.readUInt32BE(16)).toBe(size)
    expect(data.readUInt32BE(20)).toBe(size)
  })
})
