export const setWithExpiry = (key: string, value: any, ttl: number) => {
  const item = {
    value: value,
    expiry: new Date().getTime() + ttl,
  }
  localStorage.setItem(key, JSON.stringify(item))
}

export const getWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key)
  if (!itemStr) {
    return null
  }
  const item = JSON.parse(itemStr)
  const isExpired = new Date().getTime() > item.expiry

  if (isExpired) {
    localStorage.removeItem(key)
    return null
  }

  return item.value
}
