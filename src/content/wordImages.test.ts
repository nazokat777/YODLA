import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ALL_IMAGE_CODES, imageCodeFor, imageUrlFor } from './wordImages'

describe('imageCodeFor', () => {
  it('oddiy so‘zni topadi', () => {
    expect(imageCodeFor('olma')).toBe('1F34E')
  })

  it('katta harf va bo‘shliqqa qaramaydi', () => {
    expect(imageCodeFor('  Olma ')).toBe('1F34E')
  })

  it('turli apostroflar BIR XIL so‘z hisoblanadi', () => {
    /*
     * Lug'atlarda `go'sht`, `go‘sht` va `go’sht` uchraydi — bir so'z,
     * lekin uch xil satr. Normallashtirmasa rasm kartaning yozilishiga
     * qarab goh topilar, goh topilmasdi.
     */
    expect(imageCodeFor("go'sht")).toBe('1F356')
    expect(imageCodeFor('go‘sht')).toBe('1F356')
    expect(imageCodeFor('go’sht')).toBe('1F356')
  })

  it('qavs va vergul ichidagi izohni tashlaydi', () => {
    expect(imageCodeFor('olma (meva)')).toBe('1F34E')
    expect(imageCodeFor('olma, anor')).toBe('1F34E')
  })

  it('rasmi yo‘q so‘z uchun null', () => {
    expect(imageCodeFor('mohiyat')).toBeNull()
    expect(imageUrlFor('mohiyat')).toBeNull()
  })

  it('manzil public papkadagi faylga ishora qiladi', () => {
    expect(imageUrlFor('olma')).toBe('/word-images/1F34E.svg')
  })
})

describe('rasm fayllari', () => {
  it('xaritadagi HAR BIR kod uchun fayl mavjud', () => {
    /*
     * Fayl yetishmasa foydalanuvchi buzilgan rasm belgisini ko'radi.
     * Bu jimgina sodir bo'ladi: `<img>` xatosi konsolga ham chiqmaydi.
     * Shuning uchun mavjudlik shu yerda tekshiriladi.
     */
    const files = new Set(readdirSync('public/word-images'))

    const missing = ALL_IMAGE_CODES.filter((code) => !files.has(`${code}.svg`))

    expect(missing).toEqual([])
  })

  it('ortiqcha fayl qolmagan — xaritadan olib tashlangani o‘chirilsin', () => {
    const codes = new Set(ALL_IMAGE_CODES)

    const extra = readdirSync('public/word-images').filter(
      (file) => !codes.has(file.replace('.svg', '')),
    )

    expect(extra).toEqual([])
  })
})
