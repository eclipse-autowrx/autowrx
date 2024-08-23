export const sentenceCase = (str: string) => {
  if (str.length === 0) return ''
  if (str.length === 1) return str.toUpperCase()
  return str.charAt(0).toUpperCase() + str.slice(1)
}
