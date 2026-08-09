import { describe, expect, it } from 'vitest'
import { isCloudEnabled } from './supabase'

describe('isCloudEnabled', () => {
  it('kalitlar bo‘lmasa false — ilova lokal rejimda ishlaydi', () => {
    // Testlarda env bo'sh; bulut yo'qligi XATO EMAS, kutilgan holat
    expect(isCloudEnabled()).toBe(false)
  })
})
