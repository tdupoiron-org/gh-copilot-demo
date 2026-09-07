const FRENCH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/
const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validates a date in DD/MM/YYYY format and returns the corresponding Date.
 */
export function validateDate(value: string): Date {
  const match = FRENCH_DATE_PATTERN.exec(value)
  if (!match) {
    throw new Error('Date must use the DD/MM/YYYY format')
  }

  const [, dayText, monthText, yearText] = match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Date is invalid')
  }

  return date
}

export function validateGUID(value: string): boolean {
  return GUID_PATTERN.test(value)
}

export function validateIPV6(value: string): boolean {
  if (!value || value.includes('%')) {
    return false
  }

  const [address, ...rest] = value.split('/')
  if (rest.length > 1 || (rest.length === 1 && !isValidPrefixLength(rest[0]))) {
    return false
  }

  if (address.includes(':::')) {
    return false
  }

  const groups = address.split(':')
  const hasCompression = address.includes('::')

  const normalizedGroups = hasCompression
    ? groups.filter((group) => group !== '')
    : groups
  const expandedGroupCount = normalizedGroups.reduce(
    (count, group) => count + (group.includes('.') ? 2 : 1),
    0,
  )

  if (
    (hasCompression && expandedGroupCount >= 8) ||
    (!hasCompression && expandedGroupCount !== 8)
  ) {
    return false
  }

  return normalizedGroups.every((group) =>
    group.includes('.')
      ? isValidIPv4(group)
      : /^[0-9a-f]{1,4}$/i.test(group),
  )
}

function isValidPrefixLength(value: string): boolean {
  return /^\d{1,3}$/.test(value) && Number(value) <= 128
}

function isValidIPv4(value: string): boolean {
  const octets = value.split('.')
  return (
    octets.length === 4 &&
    octets.every(
      (octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255,
    )
  )
}
