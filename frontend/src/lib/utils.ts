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

// Dashboard utils : Checking if the selected cells are continuous rectangle
export const isContinuousRectangle = (pickedCells: number[]): boolean => {
  const numCols = 5
  if (pickedCells.length <= 1) return true // Single cell is always valid
  // Convert cell number to grid position
  const toGridPosition = (cell: number): [number, number] => {
    let row = Math.floor((cell - 1) / numCols)
    let col = (cell - 1) % numCols
    return [row, col]
  }
  // Create a matrix to represent the grid
  let grid = Array(2)
    .fill(null)
    .map(() => Array(5).fill(false))
  // Mark the selected cells in the grid
  pickedCells.forEach((cell) => {
    const [row, col] = toGridPosition(cell)
    grid[row][col] = true
  })
  // Find the bounding box of the selected cells
  let minRow = 2,
    maxRow = -1,
    minCol = 5,
    maxCol = -1
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        minRow = Math.min(minRow, rowIndex)
        maxRow = Math.max(maxRow, rowIndex)
        minCol = Math.min(minCol, colIndex)
        maxCol = Math.max(maxCol, colIndex)
      }
    })
  })
  // Check all cells within the bounding box are selected
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!grid[row][col]) {
        return false // Found a cell in the bounding box that is not selected
      }
    }
  }
  return true // All cells within the bounding box are selected
}

// Dashboard utils : Calculate the rowSpan and colSpan of widget box to merge the cells
export const calculateSpans = (boxes: any) => {
  let minCol = Math.min(...boxes.map((box: any) => ((box - 1) % 5) + 1))
  let maxCol = Math.max(...boxes.map((box: any) => ((box - 1) % 5) + 1))
  let minRow = Math.ceil(Math.min(...boxes) / 5)
  let maxRow = Math.ceil(Math.max(...boxes) / 5)

  let colSpan = maxCol - minCol + 1
  let rowSpan = maxRow - minRow + 1

  return { rowSpan, colSpan }
}

export const doesOverlap = (
  widgetConfigs: any[],
  updatedWidgetConfig: any,
  index: number,
): boolean => {
  const otherWidgets = widgetConfigs.filter((_, idx) => idx !== index)
  const updatedBoxes = new Set(updatedWidgetConfig.boxes)
  for (const widget of otherWidgets) {
    if (widget.boxes.some((box: number) => updatedBoxes.has(box))) {
      return true
    }
  }
  return false
}

// Handle case when prototype's widget config is an object instead of an array
export const parseWidgetConfig = (configStr: any) => {
  if (!configStr) return []

  try {
    const parsedConfig =
      typeof configStr === 'string' ? JSON.parse(configStr) : configStr
    return Array.isArray(parsedConfig)
      ? parsedConfig
      : parsedConfig.widgets || []
  } catch (e) {
    console.error('Error normalizing widget config:', e)
    return []
  }
}

export const isBinaryFile = (fileName: string): boolean => {
  const binaryExtensions = [
    // Images
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.ico',
    '.webp',
    '.svg',
    // Archives
    '.zip',
    '.gz',
    '.tar',
    '.rar',
    '.7z',
    // Documents
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    // Other
    '.exe',
    '.dll',
    '.so',
    '.class',
    '.pyc',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.eot',
  ]
  const extension = (fileName.match(/\.[^.]+$/) || [''])[0].toLowerCase()
  return binaryExtensions.includes(extension)
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}
