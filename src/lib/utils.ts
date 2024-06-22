import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Cvi, VehicleApi } from '@/types/model.type'
import { WidgetConfig } from '@/types/widget.type'

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
  ): VehicleApi[] => {
    let result: VehicleApi[] = []

    result.push({ ...node, name: prefix })

    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`
        node.children[key].name = newPrefix
        result = result.concat(traverse(child, newPrefix))
      }
    }

    return result
  }

  return traverse(cvi.Vehicle)
}

export const copyText = async (
  text: string,
  copiedText: string = 'Copied!',
) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log(copiedText)
  } catch (error) {
    console.log(`Error occured while copying to clipboard. ${error}`)
  }
}

// Dashboard utils : Checking if the selected cells are continuous rectangle
export const isContinuousRectangle = (pickedCells: number[]): boolean => {
  // console.log("pickedCells", pickedCells);
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
  widgetConfigs: WidgetConfig[],
  updatedWidgetConfig: WidgetConfig,
  index: number,
): boolean => {
  const otherWidgets = widgetConfigs.filter((_, idx) => idx !== index)
  const updatedBoxes = new Set(updatedWidgetConfig.boxes)
  for (const widget of otherWidgets) {
    for (const box of widget.boxes) {
      if (updatedBoxes.has(box)) {
        return true
      }
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

export const maskEmail = (email: string) => {
  const [localPart, domainPart] = email.split('@')
  const maskedLocalPart =
    localPart.slice(0, 6).replace(/./g, 'x') + localPart.slice(6)
  return `${maskedLocalPart}@${domainPart}`
}
