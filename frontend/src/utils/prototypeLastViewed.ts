const PROTOTYPE_LAST_VIEWED_KEY = 'prototype_last_viewed'

export type PrototypeLastViewed = Record<string, number>

export const getPrototypeLastViewed = (): PrototypeLastViewed => {
  try {
    const rawValue = localStorage.getItem(PROTOTYPE_LAST_VIEWED_KEY)
    if (!rawValue) return {}

    const parsedValue: unknown = JSON.parse(rawValue)
    if (
      !parsedValue ||
      typeof parsedValue !== 'object' ||
      Array.isArray(parsedValue)
    ) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedValue).filter(
        ([prototypeId, timestamp]) =>
          prototypeId.length > 0 &&
          typeof timestamp === 'number' &&
          Number.isFinite(timestamp),
      ),
    )
  } catch {
    return {}
  }
}

export const recordPrototypeLastViewed = (prototypeId: string) => {
  if (!prototypeId) return

  try {
    const lastViewed = getPrototypeLastViewed()
    lastViewed[prototypeId] = Date.now()
    localStorage.setItem(PROTOTYPE_LAST_VIEWED_KEY, JSON.stringify(lastViewed))
  } catch {
    // Ignore unavailable storage and quota errors.
  }
}
