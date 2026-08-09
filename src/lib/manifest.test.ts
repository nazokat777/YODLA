import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))

describe('manifest.webmanifest', () => {
  it('o‘rnatish uchun zarur maydonlar bor', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
  })

  it('ilovadek ochiladi va brend ranglarini ishlatadi', () => {
    // `standalone` — brauzer paneli ko'rinmaydi
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe('#10b981')
    expect(manifest.background_color).toBe('#10b981')
  })

  it('har bir ikonka fayli mavjud', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)

    manifest.icons.forEach((icon: { src: string; sizes: string; type: string }) => {
      expect(existsSync(`public${icon.src}`)).toBe(true)
      expect(icon.type).toBe('image/png')
      expect(icon.sizes).toMatch(/^\d+x\d+$/)
    })
  })

  it('Android adaptiv shakl uchun maskable ikonka bor', () => {
    const maskable = manifest.icons.filter((icon: { purpose?: string }) =>
      icon.purpose?.includes('maskable'),
    )

    expect(maskable.length).toBeGreaterThan(0)
  })
})

describe('index.html', () => {
  const html = readFileSync('index.html', 'utf8')

  it('manifestga havola qiladi', () => {
    expect(html).toContain('rel="manifest"')
  })

  it('iOS uchun apple-touch-icon beradi', () => {
    // iOS manifestdagi ikonkalarni o'qimaydi
    expect(html).toContain('apple-touch-icon')
  })
})
