import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Cvi, VehicleApi } from '@/types/model.type'

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
    default:
      return { bgClass: 'bg-da-gray-medium', textClass: 'text-da-gray-medium' }
  }
}

export const parseCvi = (cvi: Cvi) => {
  const traverse = (
    node: VehicleApi,
    prefix: string = 'Vehicle',
  ): { api: string; type: string; details: VehicleApi }[] => {
    let result: { api: string; type: string; details: VehicleApi }[] = []
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        node.children[key].api = newPrefix
        result.push({ api: newPrefix, type: child.type, details: child })
        result = result.concat(traverse(child, newPrefix))
      }
    }
    return result
  }
  return traverse(cvi.Vehicle)
}
