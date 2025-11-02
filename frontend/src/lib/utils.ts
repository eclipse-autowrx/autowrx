import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email
  }

  const [username, domain] = email.split('@')

  if (username.length <= 2) {
    return `${username[0]}***@${domain}`
  }

  const visibleChars = Math.min(3, Math.floor(username.length / 3))
  const maskedUsername = username.substring(0, visibleChars) + '***'

  return `${maskedUsername}@${domain}`
}

export const parseCvi = (cvi: any) => {
  const traverse = (node: any, prefix: string = 'Vehicle'): any[] => {
    let result: any[] = []

    // include current node with full path name
    result.push({ ...node, name: prefix })

    if (node && node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        result = result.concat(traverse(child, newPrefix))
      }
    }

    return result
  }

  if (!cvi || typeof cvi !== 'object') return []
  const mainApi = Object.keys(cvi).at(0) || 'Vehicle'
  const root = (cvi as any)[mainApi]
  if (!root) return []
  return traverse(root, mainApi)
}

export const getCSSVariable = (variableName: string): string => {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
}

export const getApiTypeClasses = (type: string) => {
  switch (type) {
    case 'branch':
      return { bgClass: 'bg-purple-500', textClass: 'text-purple-500' }
    case 'actuator':
      return { bgClass: 'bg-yellow-500', textClass: 'text-yellow-500' }
    case 'sensor':
      return { bgClass: 'bg-emerald-500', textClass: 'text-emerald-500' }
    case 'attribute':
      return { bgClass: 'bg-sky-500', textClass: 'text-sky-500' }
    case 'Atomic Service':
      return { bgClass: 'bg-purple-500', textClass: 'text-purple-500' }
    case 'Basic Service':
      return { bgClass: 'bg-emerald-500', textClass: 'text-emerald-500' }
    default:
      return { bgClass: 'bg-gray-500', textClass: 'text-gray-500' }
  }
}
