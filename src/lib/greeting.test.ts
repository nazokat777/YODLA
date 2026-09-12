import { describe, expect, it } from 'vitest'
import { greetingFor } from './greeting'

describe('greetingFor', () => {
  it('kun vaqtiga mos', () => {
    expect(greetingFor(7)).toBe('Xayrli tong')
    expect(greetingFor(13)).toBe('Xayrli kun')
    expect(greetingFor(20)).toBe('Xayrli kech')
    expect(greetingFor(2)).toBe('Xayrli tun')
  })
})
