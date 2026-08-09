import { describe, expect, it } from 'vitest'
import { buttonStyles } from './buttonStyles'

describe('buttonStyles', () => {
  it('secondary tugma ham chuqurlikka ega', () => {
    // Bir ekranda ikki xil tugma fizikasi ko'rinmasligi kerak
    expect(buttonStyles({ variant: 'secondary' })).toContain('border-b-4')
  })

  it('primary tugma soyasi saqlanadi', () => {
    expect(buttonStyles({ variant: 'primary' })).toContain('shadow-[0_4px_0_0]')
  })

  it('ghost tugma ATAYLAB tekis qoladi', () => {
    // U matn tugmasi — chuqurlik berilsa ierarxiya buzilardi
    const styles = buttonStyles({ variant: 'ghost' })

    expect(styles).not.toContain('border-b-4')
    expect(styles).not.toContain('shadow-[0_4px_0_0]')
  })

  it('barcha tugmalarda harflar oralig‘i kengaytirilgan', () => {
    expect(buttonStyles({})).toContain('tracking-wide')
  })

  it('bosilganda cho‘kadi', () => {
    expect(buttonStyles({})).toContain('active:translate-y-[2px]')
  })
})
