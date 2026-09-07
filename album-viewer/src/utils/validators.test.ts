import { describe, expect, it } from 'vitest'
import { validateDate, validateGUID, validateIPV6 } from './validators'

describe('validateDate', () => {
  it('returns a Date for a valid French date', () => {
    expect(validateDate('01/01/2019')).toEqual(new Date(2019, 0, 1))
  })

  it('returns a Date for a valid leap day', () => {
    expect(validateDate('29/02/2020')).toEqual(new Date(2020, 1, 29))
  })

  it('rejects impossible calendar dates', () => {
    expect(() => validateDate('31/02/2019')).toThrow()
  })

  it('rejects a leap day on a non-leap year', () => {
    expect(() => validateDate('29/02/2019')).toThrow('Date is invalid')
  })

  it('rejects values with the wrong format', () => {
    expect(() => validateDate('2019-01-01')).toThrow(
      'Date must use the DD/MM/YYYY format',
    )
  })

  it('rejects an empty string', () => {
    expect(() => validateDate('')).toThrow()
  })
})

describe('validateGUID', () => {
  it('accepts a valid versioned GUID', () => {
    expect(validateGUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('accepts an uppercase GUID', () => {
    expect(validateGUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })

  it('rejects malformed GUIDs', () => {
    expect(validateGUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false)
  })

  it('rejects a GUID with an invalid version nibble', () => {
    expect(validateGUID('550e8400-e29b-91d4-a716-446655440000')).toBe(false)
  })

  it('rejects a GUID with an invalid variant nibble', () => {
    expect(validateGUID('550e8400-e29b-41d4-0716-446655440000')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(validateGUID('')).toBe(false)
  })
})

describe('validateIPV6', () => {
  it('accepts compressed and full IPv6 addresses', () => {
    expect(validateIPV6('2001:db8::1')).toBe(true)
    expect(validateIPV6('2001:0db8:0000:0000:0000:ff00:0042:8329')).toBe(true)
  })

  it('accepts IPv6 addresses with a valid prefix length', () => {
    expect(validateIPV6('2001:db8::/32')).toBe(true)
    expect(validateIPV6('::/0')).toBe(true)
  })

  it('accepts IPv4-mapped IPv6 addresses', () => {
    expect(validateIPV6('::ffff:192.168.1.1')).toBe(true)
    expect(validateIPV6('64:ff9b::192.0.2.33')).toBe(true)
  })

  it('rejects malformed IPv6 addresses', () => {
    expect(validateIPV6('2001:db8:::1')).toBe(false)
    expect(validateIPV6('2001:db8::1/129')).toBe(false)
  })

  it('rejects an empty string or a zone-scoped address', () => {
    expect(validateIPV6('')).toBe(false)
    expect(validateIPV6('fe80::1%eth0')).toBe(false)
  })

  it('rejects an address with more than one prefix separator', () => {
    expect(validateIPV6('2001:db8::1/32/64')).toBe(false)
  })

  it('rejects a non-numeric prefix length', () => {
    expect(validateIPV6('2001:db8::1/abc')).toBe(false)
  })

  it('rejects an IPv4-mapped address with an invalid octet', () => {
    expect(validateIPV6('::ffff:192.168.1.999')).toBe(false)
    expect(validateIPV6('::ffff:192.168.1')).toBe(false)
  })

  it('rejects an address with too many or too few groups', () => {
    expect(
      validateIPV6('2001:0db8:0000:0000:0000:ff00:0042:8329:1234'),
    ).toBe(false)
    expect(validateIPV6('2001:0db8:0000:0000:0000:ff00:0042')).toBe(false)
  })
})
