import { describe, expect, it } from 'vitest'
import { validateDate, validateGUID, validateIPV6 } from './validators'

describe('validateDate', () => {
  it('returns a Date for a valid French date', () => {
    expect(validateDate('01/01/2019')).toEqual(new Date(2019, 0, 1))
  })

  it('rejects impossible calendar dates', () => {
    expect(() => validateDate('31/02/2019')).toThrow()
  })

  it('rejects values with the wrong format', () => {
    expect(() => validateDate('2019-01-01')).toThrow()
  })
})

describe('validateGUID', () => {
  it('accepts a valid versioned GUID', () => {
    expect(validateGUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('rejects malformed GUIDs', () => {
    expect(validateGUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false)
  })
})

describe('validateIPV6', () => {
  it('accepts compressed and full IPv6 addresses', () => {
    expect(validateIPV6('2001:db8::1')).toBe(true)
    expect(validateIPV6('2001:0db8:0000:0000:0000:ff00:0042:8329')).toBe(true)
  })

  it('accepts IPv6 addresses with a valid prefix length', () => {
    expect(validateIPV6('2001:db8::/32')).toBe(true)
  })

  it('rejects malformed IPv6 addresses', () => {
    expect(validateIPV6('2001:db8:::1')).toBe(false)
    expect(validateIPV6('2001:db8::1/129')).toBe(false)
  })
})
