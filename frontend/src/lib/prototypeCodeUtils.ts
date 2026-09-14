export function hasPrototypeCode(code?: string | null): boolean {
  if (!code?.trim()) return false
  try {
    const parsed = JSON.parse(code)
    if (Array.isArray(parsed)) return parsed.length > 0
  } catch {
    /* plain source */
  }
  return true
}
